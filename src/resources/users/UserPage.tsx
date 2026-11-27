import { useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Blocks, Button, DangerZone, Note, Page, PageActions, Text, TextField } from '../../ui/index.js';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { mayDelete, mayDo, mayPut, useOwnGrants } from '../../bridges/own-grants.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import {
  BUILT_IN_ROLES, PEOPLE, peopleReducer, personUri, putPerson, servesPeople, userBody, userFields, writesPeople,
  type ListedUser, type Named, type PeopleState, type Role, type UserFields,
} from '../../bridges/people.js';
import { confirm } from '../../shell/notify/index.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { isRecordId } from './form.js';
import { personTab } from './state.js';
import { MembershipList } from './MembershipList.js';
import { RolePills } from './RolePills.js';
import { KeysOf } from '../profile/Keys.js';
import { servesTokens } from '../../bridges/tokens.js';
import { EMOJIcon } from '../emojis.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageSpinner } from '../../ui/display/PageSpinner.js';

const usersReducer = peopleReducer('users');
const rolesReducer = peopleReducer('roles');
const teamsReducer = peopleReducer('teams');
const projectsReducer = peopleReducer('projects');

/** The role that grants everything; taking it off oneself asks first. */
const ADMIN = 'admin';

/** A user: their roles, what their work is charged to, and how they sign in. A new user when there is no `id`. */
export default function UserPage({ host, person: id }: { host: string; person?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const users = useChannel<PeopleState<ListedUser>>(host, PEOPLE.users.channel, usersReducer);
  const roles = useChannel<PeopleState<Role>>(host, servesPeople(offers, 'roles') ? PEOPLE.roles.channel : undefined, rolesReducer);
  const teams = useChannel<PeopleState<Named>>(host, servesPeople(offers, 'teams') ? PEOPLE.teams.channel : undefined, teamsReducer);
  const projects = useChannel<PeopleState<Named>>(host, servesPeople(offers, 'projects') ? PEOPLE.projects.channel : undefined, projectsReducer);
  const grants = useOwnGrants(host, offers);
  const [draft, setDraft] = useState<(UserFields & { id: string }) | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (users.error !== null) return <PageAlert tone="danger" title={t('users/notices/none')} message={users.error} />;
  if (users.state === undefined) return <PageSpinner label={t('users/notices/reading')} />;
  const record = fresh ? undefined : users.state.records.find((one) => one.id === id)?.record;
  if (!fresh && record === undefined) return <PageAlert tone="warning" message={t('users/user/gone')} />;

  const start = { id: id ?? '', ...userFields(record) };
  const shown = draft ?? start;
  const set = (change: Partial<UserFields & { id: string }>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  // What the host refuses this reader is not drawn.
  const writes = mayPut(offers, grants, 'users');
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(start);
  const roleIds = [...new Set([...(roles.state?.records.map((one) => one.id) ?? []), ...Object.keys(BUILT_IN_ROLES), ...shown.roles])].sort();
  const ready = writes && !busy && (fresh ? isRecordId(shown.id) : dirty);
  const tab = personTab('users', host, id);
  // The signed-in person, as `user:<id>`, whose own admin role is not taken away by a slip.
  const self = offers.principal === `user:${id ?? ''}`;

  const save = async (): Promise<void> => {
    if (self && start.roles.includes(ADMIN) && !shown.roles.includes(ADMIN) && !(await confirm({
      title: t('users/user/dropAdminTitle'),
      body: t('users/user/dropAdminBody'),
      confirmLabel: t('users/user/save'),
      tone: 'danger',
    }))) return;
    setBusy(true);
    setFailure(null);
    const target = shown.id.trim();
    try {
      await putPerson(host, offers, 'users', target, userBody(shown), fresh);
      setDraft(null);
      if (fresh) {
        scena.surfaces.close(tab);
        void scena.commands.execute('ahp.openUser', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  /** A section: its icon and title over its fields, a line above it. */
  const section = (icon: string | undefined, title: string, body: ReactElement): ReactElement => (
    <section className="web-user__section" aria-label={title}>
      <Text variant="h3" text={icon === undefined ? title : `${icon} ${title}`} />
      {body}
    </section>
  );
  return (
    <Page>
      <PageTitle emoji={EMOJIcon.users} initials={fresh ? undefined : id} title={fresh ? t('users/commands/newUser') : id} uri={fresh ? undefined : personUri(offers, 'users', id)} />
      {writes ? null : <Note>{t(writesPeople(offers, 'users') ? 'users/notices/noPermission' : 'users/notices/readOnly')}</Note>}

      {fresh ? (
        <TextField label={t('users/user/id')} hint={t('users/user/idHint')} value={shown.id} autoFocus onChange={(next) => set({ id: next })} />
      ) : null}

      {section(EMOJIcon.roles, t('users/user/roles'), roleIds.length === 0 ? <Text variant="caption" muted text={t('users/user/noRoles')} /> : (
        <RolePills held={shown.roles} offered={roleIds.filter((one) => !shown.roles.includes(one))} writes={writes} onChange={(roles) => set({ roles })} onOpen={(role) => void scena.commands.execute('ahp.openRole', { host, id: role })} />
      ))}

      {section(EMOJIcon.teams, t('users/user/memberships'), (
        <MembershipList
          memberships={shown.memberships}
          primary={shown.primary}
          teams={teams.state?.records.map((one) => one.record) ?? []}
          projects={projects.state?.records.map((one) => one.record) ?? []}
          writes={writes}
          onChange={set}
          onOpen={(domain, target) => void scena.commands.execute(domain === 'teams' ? 'ahp.openTeam' : 'ahp.openProject', { host, id: target })}
        />
      ))}

      {section(EMOJIcon.signIn, t('users/user/signIn'), (
        <>
          <TextField label={t('users/user/issuer')} hint={t('users/user/issuerHint')} value={shown.issuer} readOnly={!writes} onChange={(next) => set({ issuer: next })} />
          <TextField label={t('users/user/rolesFrom')} hint={t('users/user/rolesFromHint')} value={shown.rolesFrom} readOnly={!writes} onChange={(next) => set({ rolesFrom: next })} />
        </>
      ))}

      {failure === null ? null : <Alert tone="danger" message={failure} />}
      {writes ? (
        <PageActions>
          <Button label={t(fresh ? 'users/user/create' : 'users/user/save')} variant="primary" disabled={!ready} onClick={() => void save()} />
          {fresh ? <Button label={t('users/actions/cancel')} onClick={() => scena.surfaces.close(tab)} /> : null}
          {!fresh && dirty ? <Button label={t('users/actions/discard')} onClick={() => setDraft(null)} /> : null}
        </PageActions>
      ) : null}

      {/* After the actions: a key is made or revoked at once, not on Save. Their own keys are the person's to manage, as on their profile. */}
      {fresh || !(self || mayDo(grants, 'user:write')) || !servesTokens(offers) ? null : section(EMOJIcon.keys, t('users/user/keys'), (
        <Blocks>
          <Text variant="caption" muted text={t('users/user/keysHint', { id })} />
          <KeysOf host={host} {...(self ? {} : { user: id })} grants={record?.grants ?? []} />
        </Blocks>
      ))}

      {fresh || !mayDelete(offers, grants, 'users') ? null : <DangerZone label={t('users/actions/delete')} onConfirm={() => void scena.commands.execute('ahp.deleteUser', { host, id })} />}
    </Page>
  );
}
