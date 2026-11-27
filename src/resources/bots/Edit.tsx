import { useMemo, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, ChoicePicker, FormRow, Note, Page, PageActions, Row, Swatches, Text, TextField } from '../../ui/index.js';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useOwnGrantsOnEach } from '../../bridges/own-grants.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { writeLastHost } from '../sessions/last-host.js';
import { useMe } from '../../bridges/me.js';
import { membershipParts } from '../users/memberships.js';
import { BotFields } from './BotFields.js';
import { Bood } from './Bood.js';
import { BOT_PROVIDER, BOTS, BOTS_SCHEME, botsIn, botsReducer, editBot, makeBot, mayChangeBots, type BotRecord, type BotsState } from './catalogue.js';
import { connectorsValid, draftOf, recordBody, renamedFor, type BotDraft } from './draft.js';
import { BOT_BODIES, COLOR_HEX, knowsBody, slugOf } from './look.js';
import { PageSpinner } from '../../ui/display/PageSpinner.js';
import './edit.css';

/** How many slugs a new bot tries, since a host never gives a deleted bot's slug again. */
const SLUG_TRIES = 5;

/** The host's own owner, which its bot manifest offers as `root:<host>` to whoever may name it. */
function hostOwnerOf(offers: Offers): string | undefined {
  const owner = offers.providers[BOT_PROVIDER]?.manifest?.properties as Record<string, { anyOf?: { const?: unknown }[] }> | undefined;
  const root = owner?.owner?.anyOf?.find((one) => typeof one.const === 'string' && one.const.startsWith('root:'));
  return typeof root?.const === 'string' ? root.const : undefined;
}

/** The owners a person may give a new bot: themselves, each team and project they belong to, and the host where it offers itself. */
function ownerChoices(memberships: readonly string[], hostOwner: string | undefined, words: { me: string; host: string; team: (team: string) => string; project: (team: string, project: string) => string }): { value: string; label: string }[] {
  const held = [...new Set(memberships)].sort().map((one) => {
    const { team, project } = membershipParts(one);
    return project === null ? { value: `team:${team}`, label: words.team(team) } : { value: `project:${team}:${project}`, label: words.project(team, project) };
  });
  return [{ value: '', label: words.me }, ...held, ...(hostOwner === undefined ? [] : [{ value: hostOwner, label: words.host }])];
}

/** How an owner reads: `root:` is this host, a team or project by its name, anyone else as the host says it. */
function ownerLabel(owner: string, words: { host: string; team: (team: string) => string; project: (team: string, project: string) => string }): string {
  if (owner.startsWith('root:')) return words.host;
  if (owner.startsWith('team:')) return words.team(owner.slice('team:'.length));
  if (owner.startsWith('project:')) {
    const { team, project } = membershipParts(owner.slice('project:'.length));
    return project === null ? words.team(team) : words.project(team, project);
  }
  return owner;
}

/** Where a new bot's folder goes when it names none: beside the host's other bots, as their folders show it. */
function folderBeside(bots: readonly BotRecord[], slug: string): string {
  const own = bots.find((one) => one.workspace.endsWith(`/${one.id}`) || one.workspace.endsWith(`\\${one.id}`));
  return own === undefined ? '' : `${own.workspace.slice(0, own.workspace.length - own.id.length)}${slug}`;
}

/** What a form that ended says: the bot it saved, or nothing when it was cancelled. */
export type BotFormDone = (saved?: { slug: string; name: string }) => void;

/** Makes a bot, or edits the one named by `slug`: its look first, then what it is and whose. */
export function BotForm({ host: opened, slug, onDone }: { host: string; slug?: string; onDone: BotFormDone }): ReactElement {
  const { t } = useI18n();
  const fresh = slug === undefined;
  const serving = useServingHosts(useShownHosts(), BOTS_SCHEME);
  const servingOffers = useEach<Offers>(serving.map((one) => ahpPaths(one).offers));
  const servingGrants = useOwnGrantsOnEach(serving, servingOffers);
  // A new bot goes only to a host where the reader may make one.
  const hosts = useMemo(
    () => serving.filter((one, at) => mayChangeBots(servingOffers[at] ?? NO_OFFERS, servingGrants[at] ?? null, 'put')),
    [serving, servingOffers, servingGrants],
  );
  const hostName = useHostNames();
  const [host, setHost] = useState(opened);
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const me = useMe(host);
  const { state, error } = useChannel<BotsState>(host, BOTS, botsReducer);
  const [draft, setDraft] = useState<BotDraft | null>(null);
  // The form's start, drawn once: a new bot's look is random.
  const first = useRef<BotDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (error !== null) return <PageAlert tone="danger" title={t('bots/notices/none')} message={error} />;
  if (state === undefined) return <PageSpinner label={t('bots/notices/reading')} />;
  const bot = fresh ? undefined : botsIn(state).find((one) => one.id === slug);
  if (!fresh && bot === undefined) return <PageAlert tone="warning" message={t('bots/notices/gone')} />;

  first.current ??= draftOf(bot, botsIn(state));
  const shown = draft ?? first.current;
  const start = first.current;
  const set = (change: Partial<BotDraft>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  const hostOwner = hostOwnerOf(offers);
  const ready = !busy && shown.name.trim() !== '' && shown.body.trim() !== '' && connectorsValid(shown.connectors);
  const ownerWords = {
    me: t('bots/edit/ownerMe'),
    host: t('bots/edit/ownerHost'),
    team: (team: string) => t('bots/edit/ownerTeam', { team }),
    project: (team: string, project: string) => t('bots/edit/ownerProject', { team, project }),
  };
  const owners = ownerChoices(me?.memberships ?? [], hostOwner, ownerWords);
  const taken = botsIn(state).map((one) => one.id);

  const save = (): void => {
    setBusy(true);
    setFailure(null);
    const body = recordBody(shown, fresh, start);
    const written = bot === undefined
      ? (() => {
        const slugs: string[] = [];
        for (let n = 0; n < SLUG_TRIES; n += 1) slugs.push(slugOf(shown.name, [...taken, ...slugs]));
        return makeBot(host, offers, slugs, body);
      })()
      : editBot(host, offers, bot, body).then(() => bot.id);
    void written.then(
      (made) => onDone({ slug: made, name: shown.name.trim() }),
      (caught: unknown) => {
        setFailure(caught instanceof Error ? caught.message : String(caught));
        setBusy(false);
      },
    );
  };

  return (
    <Page>
      <Text variant="h2" text={fresh ? t('bots/commands/new') : t('bots/editTitle', { name: bot!.name })} />

      <Row align="center" gap="var(--oo-spacing-lg)">
        <Bood body={shown.body} color={shown.color} width={120} />
        <div className="web-bot-look__pickers">
          <Swatches
            label={t('bots/edit/color')}
            options={Object.entries(COLOR_HEX).map(([name, hex]) => ({ id: hex, label: t(`bots/colors/${name}`), color: hex }))}
            value={shown.color}
            onChange={(hex) => set({ color: hex })}
          />
          <Swatches
            label={t('bots/edit/body')}
            options={BOT_BODIES.map((body) => ({ id: body, label: body, content: <Bood body={body} color={shown.color} width={30} still /> }))}
            value={shown.body}
            onChange={(body) => set({ body, name: renamedFor(shown.name, shown.body, body) })}
          />
          {/* A host keeps any word as a body; the buttons above are the ones bood draws. */}
          <TextField value={shown.body} ariaLabel={t('bots/edit/bodyName')} placeholder={t('bots/edit/bodyName')} onChange={(next) => set({ body: next, name: renamedFor(shown.name, shown.body, next) })} />
          {shown.body.trim() === '' || knowsBody(shown.body) ? null : <Note>{t('bots/edit/bodyUnknown')}</Note>}
        </div>
      </Row>

      {fresh && embedMode() === 'multi' && hosts.length > 1 ? (
        <ChoicePicker label={t('bots/edit/host')} options={hosts.map((one) => ({ value: one, label: hostName(one) }))} value={host} onChange={(next) => { setHost(next); writeLastHost(next); set({ owner: '' }); }} />
      ) : null}

      <FormRow>
        {fresh ? (
          <TextField label={t('bots/edit/name')} value={shown.name} autoFocus onChange={(next) => set({ name: next })} />
        ) : null}
        {fresh ? (
          owners.length < 2 ? null : (
            <ChoicePicker label={t('bots/edit/owner')} hint={t('bots/edit/ownerHint')} options={owners.map((one) => ({ value: one.value, label: one.label }))} value={shown.owner} onChange={(next) => set({ owner: next })} />
          )
        ) : (
          <>
            <TextField label={t('bots/edit/owner')} hint={t('bots/edit/ownerKept')} value={ownerLabel(shown.owner, ownerWords)} readOnly />
            <TextField label={t('bots/edit/folder')} hint={t('bots/edit/folderKept')} value={shown.workspace} readOnly />
          </>
        )}
      </FormRow>

      {fresh ? null : (
        <TextField label={t('bots/edit/name')} value={shown.name} onChange={(next) => set({ name: next })} />
      )}

      <TextField label={t('bots/edit/labels')} hint={t('bots/edit/labelsHint')} value={shown.labels} onChange={(next) => set({ labels: next })} />

      <TextField label={t('bots/edit/description')} multiline rows={2} value={shown.description} onChange={(next) => set({ description: next })} />

      <TextField label={t('bots/edit/instructions')} hint={t(fresh ? 'bots/edit/instructionsHint' : 'bots/edit/instructionsLater')} multiline rows={5} value={shown.instructions} onChange={(next) => set({ instructions: next })} />

      <BotFields host={host} offers={offers} fresh={fresh} draft={shown} folderPlaceholder={folderBeside(botsIn(state), slugOf(shown.name, taken))} set={set} />

      {failure === null ? null : <Alert tone="danger" message={failure} />}
      <PageActions>
        <Button label={t(fresh ? 'bots/edit/create' : 'bots/edit/save')} variant="primary" disabled={!ready} onClick={save} />
        <Button label={t('bots/edit/cancel')} onClick={() => onDone()} />
      </PageActions>
    </Page>
  );
}

/** The page that makes a new bot, in a tab of its own that closes on Create or Cancel; a made bot opens. */
export default function BotEditPage({ host }: { host: string }): ReactElement {
  const scena = useScena();
  return (
    <BotForm
      host={host}
      onDone={(saved) => {
        scena.surfaces.close('bot:new');
        if (saved !== undefined) void scena.commands.execute('ahp.openBot', { host, slug: saved.slug, name: saved.name });
      }}
    />
  );
}
