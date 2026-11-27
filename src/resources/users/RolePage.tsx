import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Chip, DangerZone, Note, Page, PageActions, Text, TextField } from '../../ui/index.js';
import { rootReducer, type RootState } from '@microsoft/agent-host-protocol';
import { ahpPaths, ROOT } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { mayDelete, mayPut, useOwnGrants } from '../../bridges/own-grants.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { grantCatalog } from '../../bridges/grants.js';
import { BUILT_IN_ROLES, PEOPLE, peopleReducer, personUri, putPerson, writesPeople, type PeopleState, type Role } from '../../bridges/people.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { isRecordId, parseGrants } from './form.js';
import { personTab } from './state.js';
import { RoleGrants } from './RoleGrants.js';
import { EMOJIcon } from '../emojis.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageSpinner } from '../../ui/display/PageSpinner.js';

const rolesReducer = peopleReducer('roles');

/** How the grants are edited: as cards of chips, or as their text, one grant a line. */
type GrantsView = 'controls' | 'text';

/** A role: what it lets the people who hold it do. A new role when there is no `id`. */
export default function RolePage({ host, person: id }: { host: string; person?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const roles = useChannel<PeopleState<Role>>(host, PEOPLE.roles.channel, rolesReducer);
  const grants = useOwnGrants(host, offers);
  const [draft, setDraft] = useState<{ id: string; grants: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [view, setView] = useState<GrantsView>('controls');
  // Subjects added from *Add subject* that no grant names yet; a card for each until it has one.
  const [added, setAdded] = useState<string[]>([]);
  const root = useChannel<RootState>(host, ROOT, rootReducer);
  const catalog = useMemo(() => grantCatalog(root.state?._meta), [root.state?._meta]);

  if (roles.error !== null) return <PageAlert tone="danger" title={t('users/notices/none')} message={roles.error} />;
  if (roles.state === undefined) return <PageSpinner label={t('users/notices/reading')} />;
  const written = fresh ? undefined : roles.state.records.find((one) => one.id === id)?.record;
  // A built-in the file does not replace; saving it writes a role of its name, which then replaces it.
  const builtIn = !fresh && written === undefined && Object.hasOwn(BUILT_IN_ROLES, id) ? BUILT_IN_ROLES[id] : undefined;
  if (!fresh && written === undefined && builtIn === undefined) return <PageAlert tone="warning" message={t('users/role/gone')} />;
  const replaces = written !== undefined && id !== undefined && Object.hasOwn(BUILT_IN_ROLES, id);

  const start = { id: id ?? '', grants: (written?.grants ?? builtIn ?? []).join('\n') };
  const shown = draft ?? start;
  const set = (change: Partial<typeof start>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  // What the host refuses this reader is not drawn.
  const writes = mayPut(offers, grants, 'roles');
  const parsed = parseGrants(shown.grants);
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(start);
  const ready = writes && !busy && parsed.problems.length === 0 && (fresh ? isRecordId(shown.id) : dirty);
  const tab = personTab('roles', host, id);

  const save = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);
    const target = shown.id.trim();
    try {
      await putPerson(host, offers, 'roles', target, { grants: parsed.grants }, fresh);
      setDraft(null);
      if (fresh) {
        scena.surfaces.close(tab);
        void scena.commands.execute('ahp.openRole', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <PageTitle emoji={EMOJIcon.roles} initials={fresh ? undefined : id} title={fresh ? t('users/commands/newRole') : id} uri={fresh ? undefined : personUri(offers, 'roles', id)} />
      {writes ? null : <Note>{t(writesPeople(offers, 'roles') ? 'users/notices/noPermission' : 'users/notices/readOnly')}</Note>}
      {builtIn === undefined ? null : <Note>{t('users/role/builtInNote')}</Note>}
      {replaces ? <Note>{t('users/role/replacesNote')}</Note> : null}

      {fresh ? (
        <TextField label={t('users/role/id')} hint={t('users/role/idHint')} value={shown.id} autoFocus onChange={(next) => set({ id: next })} />
      ) : null}

      <div className="web-role__grants-head">
        <Text variant="h3" text={t('users/role/grants')} />
        <span className="web-role__views">
          {(['controls', 'text'] as const).map((one) => (
            <Chip
              key={one}
              label={t(`users/role/views/${one}`)}
              state={view === one ? 'on' : 'off'}
              // The controls edit parsed grants: a line that is not one keeps the text until it is fixed.
              disabled={one === 'controls' && parsed.problems.length > 0}
              {...(one === 'controls' && parsed.problems.length > 0 ? { title: t('users/role/fixText') } : {})}
              onClick={() => setView(one)}
            />
          ))}
        </span>
      </div>
      {view === 'controls' && parsed.problems.length === 0 ? (
        <RoleGrants
          grants={parsed.grants}
          catalog={catalog}
          shown={added}
          onChange={(grants) => set({ grants: grants.join('\n') })}
          onShow={setAdded}
          readOnly={!writes}
        />
      ) : (
        <>
          {/* The heading above names the box; the hint says how a line is written. */}
          <TextField
            multiline
            mono
            spellCheck={false}
            ariaLabel={t('users/role/grants')}
            hint={t('users/role/grantsHint')}
            rows={Math.max(6, shown.grants.split('\n').length + 1)}
            value={shown.grants}
            readOnly={!writes}
            onChange={(next) => set({ grants: next })}
          />
          {parsed.problems.map((problem) => (
            <p key={problem.line} className="web-people__problem">{t('users/role/badGrant', { line: problem.line, text: problem.text })}</p>
          ))}
        </>
      )}

      {failure === null ? null : <Alert tone="danger" message={failure} />}
      {writes ? (
        <PageActions>
          <Button label={t(fresh ? 'users/role/create' : 'users/role/save')} variant="primary" disabled={!ready} onClick={() => void save()} />
          {fresh ? <Button label={t('users/actions/cancel')} onClick={() => scena.surfaces.close(tab)} /> : null}
          {!fresh && dirty ? <Button label={t('users/actions/discard')} onClick={() => setDraft(null)} /> : null}
        </PageActions>
      ) : null}

      {fresh || !mayDelete(offers, grants, 'roles') || builtIn !== undefined ? null : <DangerZone label={t('users/actions/delete')} onConfirm={() => void scena.commands.execute('ahp.deleteRole', { host, id })} />}
    </Page>
  );
}
