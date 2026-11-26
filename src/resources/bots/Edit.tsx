import { useMemo, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Text } from '@softov/scena/ui';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { useEach, useHostNames, useShownHosts } from '../../bridges/hosts.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { useOwnGrantsOnEach } from '../../bridges/own-grants.js';
import { useServingHosts } from '../../bridges/served.js';
import { embedMode } from '../../shell/embed/index.js';
import { Field } from '../../shell/view/Field.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { writeLastHost } from '../sessions/last-host.js';
import { useMe } from '../../bridges/me.js';
import { membershipParts } from '../users/memberships.js';
import { BotFields } from './BotFields.js';
import { Bood } from './Bood.js';
import { BOT_PROVIDER, BOTS, BOTS_SCHEME, botsIn, botsReducer, editBot, makeBot, mayChangeBots, type BotRecord, type BotsState } from './catalogue.js';
import { connectorsValid, draftOf, recordBody, renamedFor, type BotDraft } from './draft.js';
import { BOT_BODIES, COLOR_HEX, knowsBody, slugOf } from './look.js';
import { PageSpinner } from '../../shell/view/PageSpinner.js';

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
    <div className="web-page web-form">
      <Text variant="h2" text={fresh ? t('bots/commands/new') : t('bots/editTitle', { name: bot!.name })} />

      <div className="web-bot-look">
        <Bood body={shown.body} color={shown.color} width={120} />
        <div className="web-bot-look__pickers">
          <div className="web-bot-look__colors" role="radiogroup" aria-label={t('bots/edit/color')}>
            {Object.entries(COLOR_HEX).map(([name, hex]) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={shown.color === hex}
                aria-label={t(`bots/colors/${name}`)}
                title={t(`bots/colors/${name}`)}
                className="web-bot-look__color"
                style={{ background: hex }}
                onClick={() => set({ color: hex })}
              />
            ))}
          </div>
          <div className="web-bot-look__bodies" role="radiogroup" aria-label={t('bots/edit/body')}>
            {BOT_BODIES.map((body) => (
              <button key={body} type="button" role="radio" aria-checked={shown.body === body} aria-label={body} title={body} className="web-bot-look__body" onClick={() => set({ body, name: renamedFor(shown.name, shown.body, body) })}>
                <Bood body={body} color={shown.color} width={30} still />
              </button>
            ))}
          </div>
          {/* A host keeps any word as a body; the buttons above are the ones bood draws. */}
          <input className="web-field web-bot-look__name" value={shown.body} aria-label={t('bots/edit/bodyName')} placeholder={t('bots/edit/bodyName')} onChange={(event) => set({ body: event.target.value, name: renamedFor(shown.name, shown.body, event.target.value) })} />
          {shown.body.trim() === '' || knowsBody(shown.body) ? null : <p className="web-note">{t('bots/edit/bodyUnknown')}</p>}
        </div>
      </div>

      {fresh && embedMode() === 'multi' && hosts.length > 1 ? (
        <Field label={t('bots/edit/host')}>
          <select className="web-field" value={host} onChange={(event) => { setHost(event.target.value); writeLastHost(event.target.value); set({ owner: '' }); }}>
            {hosts.map((one) => <option key={one} value={one}>{hostName(one)}</option>)}
          </select>
        </Field>
      ) : null}

      <div className="web-form__row">
        {fresh ? (
          <Field label={t('bots/edit/name')}>
            <input className="web-field" value={shown.name} autoFocus onChange={(event) => set({ name: event.target.value })} />
          </Field>
        ) : null}
        {fresh ? (
          owners.length < 2 ? null : (
            <Field label={t('bots/edit/owner')} hint={t('bots/edit/ownerHint')}>
              <select className="web-field" value={shown.owner} onChange={(event) => set({ owner: event.target.value })}>
                {owners.map((one) => <option key={one.value} value={one.value}>{one.label}</option>)}
              </select>
            </Field>
          )
        ) : (
          <>
            <Field label={t('bots/edit/owner')} hint={t('bots/edit/ownerKept')}>
              <input className="web-field" value={ownerLabel(shown.owner, ownerWords)} readOnly />
            </Field>
            <Field label={t('bots/edit/folder')} hint={t('bots/edit/folderKept')}>
              <input className="web-field" value={shown.workspace} readOnly />
            </Field>
          </>
        )}
      </div>

      {fresh ? null : (
        <Field label={t('bots/edit/name')}>
          <input className="web-field" value={shown.name} onChange={(event) => set({ name: event.target.value })} />
        </Field>
      )}

      <Field label={t('bots/edit/labels')} hint={t('bots/edit/labelsHint')}>
        <input className="web-field" value={shown.labels} onChange={(event) => set({ labels: event.target.value })} />
      </Field>

      <Field label={t('bots/edit/description')}>
        <textarea className="web-field" rows={2} value={shown.description} onChange={(event) => set({ description: event.target.value })} />
      </Field>

      <Field label={t('bots/edit/instructions')} hint={t(fresh ? 'bots/edit/instructionsHint' : 'bots/edit/instructionsLater')}>
        <textarea className="web-field web-form__message" rows={5} value={shown.instructions} onChange={(event) => set({ instructions: event.target.value })} />
      </Field>

      <BotFields host={host} offers={offers} fresh={fresh} draft={shown} folderPlaceholder={folderBeside(botsIn(state), slugOf(shown.name, taken))} set={set} />

      {failure === null ? null : <Alert tone="danger" message={failure} />}
      <div className="web-page__actions">
        <Button label={t(fresh ? 'bots/edit/create' : 'bots/edit/save')} variant="primary" disabled={!ready} onClick={save} />
        <Button label={t('bots/edit/cancel')} onClick={() => onDone()} />
      </div>
    </div>
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
