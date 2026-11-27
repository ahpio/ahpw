import { useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, DangerZone, Group, Note, Page, PageActions, Pill, RowButton, Spinner, TextField } from '../../ui/index.js';
import { ahpPaths } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { mayDelete, mayPut, useOwnGrants } from '../../bridges/own-grants.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import {
  membersOf, PEOPLE, peopleReducer, personUri, putPerson, servesPeople, userBody, userFields, writesPeople,
  type ListedUser, type Named, type PeopleState,
} from '../../bridges/people.js';
import { failed } from '../../shell/notify/index.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { isRecordId } from '../users/form.js';
import { membershipOf, membershipParts, projectChoices, teamChoices, titled } from '../users/memberships.js';
import { scopeTitle } from '../users/MembershipList.js';
import { PickTwo } from '../users/PickTwo.js';
import { teamTab } from './state.js';
import { EMOJIcon } from '../emojis.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { PageSpinner } from '../../ui/display/PageSpinner.js';
import './named-page.css';

type Kind = 'teams' | 'projects';
const reducers = { teams: peopleReducer('teams'), projects: peopleReducer('projects') };
const usersReducer = peopleReducer('users');
const listed = (state: PeopleState<Named> | undefined): Named[] => state?.records.map((one) => one.record) ?? [];

/**
 * A team or a project: its title, and who belongs to it, worked out from the
 * users' memberships. Adding or taking off a member writes that user. A new
 * one when there is no `person`.
 */
export default function NamedPage({ host, domain, person: id }: { host: string; domain: Kind; person?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const fresh = id === undefined;
  const word = domain === 'teams' ? 'team' : 'project';
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const named = useChannel<PeopleState<Named>>(host, PEOPLE[domain].channel, reducers[domain]);
  const users = useChannel<PeopleState<ListedUser>>(host, !fresh && servesPeople(offers, 'users') ? PEOPLE.users.channel : undefined, usersReducer);
  // A team's members are named with its projects, and a project's with the teams they reach it through.
  const other: Kind = domain === 'teams' ? 'projects' : 'teams';
  const others = useChannel<PeopleState<Named>>(host, fresh ? undefined : PEOPLE[other].channel, reducers[other]);
  const grants = useOwnGrants(host, offers);
  const [draft, setDraft] = useState<{ id: string; title: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (named.error !== null) return <PageAlert tone="danger" title={t('teams/notices/none')} message={named.error} />;
  if (named.state === undefined) return <PageSpinner label={t('teams/notices/reading')} />;
  const record = fresh ? undefined : named.state.records.find((one) => one.id === id)?.record;
  if (!fresh && record === undefined) return <PageAlert tone="warning" message={t(`teams/${word}/gone`)} />;

  const start = { id: id ?? '', title: record?.title ?? '' };
  const shown = draft ?? start;
  const set = (change: Partial<typeof start>): void => setDraft((held) => ({ ...(held ?? start), ...change }));
  // What the host refuses this reader is not drawn.
  const writes = mayPut(offers, grants, domain);
  const writesUsers = mayPut(offers, grants, 'users');
  const dirty = draft !== null && JSON.stringify(draft) !== JSON.stringify(start);
  const ready = writes && !busy && (fresh ? isRecordId(shown.id) : dirty);
  const tab = teamTab(domain, host, id);
  const everyone = users.state?.records.map((one) => one.record) ?? [];
  const members = fresh ? [] : membersOf(domain, id, everyone);
  const teams = listed(domain === 'teams' ? named.state : others.state);
  const projects = listed(domain === 'projects' ? named.state : others.state);
  const scopeWord = (project: string | null): string => scopeTitle(t, projects, project);

  const save = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);
    const target = shown.id.trim();
    try {
      await putPerson(host, offers, domain, target, { title: shown.title.trim() }, fresh);
      setDraft(null);
      if (fresh) {
        scena.surfaces.close(tab);
        void scena.commands.execute(domain === 'teams' ? 'ahp.openTeam' : 'ahp.openProject', { host, id: target });
      }
    } catch (caught) {
      setFailure(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  /** Writes one user's memberships, keeping the rest of what a person edits on them. */
  const writeMemberships = (user: ListedUser, memberships: string[]): void => {
    const fields = userFields(user);
    const primary = memberships.includes(fields.primary) ? fields.primary : '';
    void putPerson(host, offers, 'users', user.id, userBody({ ...fields, memberships, primary }), false)
      .catch((error: unknown) => failed(t('teams/actions/failed'), error));
  };
  /** What adding someone offers: on a team, which of its projects; on a project, which team. */
  const choicesFor = (user: ListedUser): { value: string; title: string }[] => {
    const held = user.memberships ?? [];
    return domain === 'teams'
      ? projectChoices(id!, projects.map((one) => one.id), held).map((project) => ({ value: membershipOf({ team: id!, project }), title: scopeWord(project) }))
      : teamChoices(id!, teams.map((one) => one.id), held).map((team) => ({ value: membershipOf({ team, project: id! }), title: titled(teams, team) }));
  };
  const addable = everyone.filter((user) => choicesFor(user).length > 0);
  /** How a membership reads among this team's or project's members. */
  const memberWord = (membership: string): string => {
    const { team, project } = membershipParts(membership);
    if (domain === 'teams') return scopeWord(project);
    return project === '*' ? `${titled(teams, team)} \u{00B7} ${scopeWord(project)}` : titled(teams, team);
  };

  return (
    <Page>
      <PageTitle
        emoji={EMOJIcon.teams}
        initials={fresh ? undefined : (record?.title || id)}
        title={fresh ? t(domain === 'teams' ? 'teams/commands/newTeam' : 'teams/commands/newProject') : (record?.title || id)}
        uri={fresh ? undefined : personUri(offers, domain, id)}
      />
      {writes ? null : <Note>{t(writesPeople(offers, domain) ? 'teams/notices/noPermission' : 'teams/notices/readOnly')}</Note>}

      {fresh ? (
        <TextField label={t('teams/named/id')} hint={t(`teams/${word}/idHint`)} value={shown.id} autoFocus onChange={(next) => set({ id: next })} />
      ) : null}

      <TextField label={t('teams/named/title')} hint={t('teams/named/titleHint')} value={shown.title} readOnly={!writes} onChange={(next) => set({ title: next })} />

      {failure === null ? null : <Alert tone="danger" message={failure} />}
      {writes ? (
        <PageActions>
          <Button label={t(fresh ? `teams/${word}/create` : 'teams/named/save')} variant="primary" disabled={!ready} onClick={() => void save()} />
          {fresh ? <Button label={t('teams/actions/cancel')} onClick={() => scena.surfaces.close(tab)} /> : null}
          {!fresh && dirty ? <Button label={t('teams/actions/discard')} onClick={() => setDraft(null)} /> : null}
        </PageActions>
      ) : null}

      {fresh || !servesPeople(offers, 'users') ? null : (
        <Group title={t('teams/named/members')} icon={EMOJIcon.members}>
          <Note>{t(`teams/${word}/membersHint`)}</Note>
          {users.state === undefined ? <Spinner label={t('users/notices/reading')} /> : members.length === 0 ? <Note>{t('teams/named/noMembers')}</Note> : (
            <ul className="web-people__member-list">
              {members.map((member) => {
                const user = everyone.find((one) => one.id === member.user)!;
                return (
                  <li key={member.user} className="web-people__member">
                    <RowButton fit onClick={() => void scena.commands.execute('ahp.openUser', { host, id: member.user })}>{member.user}</RowButton>
                    <span className="web-people__chips">
                      {member.through.map((membership) => (
                        <Pill
                          key={membership}
                          label={memberWord(membership)}
                          on={user.primary === membership}
                          title={user.primary === membership ? `${membership} \u{00B7} ${t('teams/named/primary')}` : membership}
                          removeLabel={t('users/user/dropMembership', { name: memberWord(membership) })}
                          {...(writesUsers ? { onRemove: () => writeMemberships(user, (user.memberships ?? []).filter((one) => one !== membership)) } : {})}
                        />
                      ))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          {writesUsers && addable.length > 0 ? (
            <PickTwo<string>
              firstLabel={t('teams/named/addWho')}
              firstHeader={t('users/explorer/users')}
              firsts={addable.map((user) => ({ value: user.id, title: user.id }))}
              secondLabel={t(domain === 'teams' ? 'users/user/whichProjects' : 'teams/named/through')}
              secondHeader={t(domain === 'teams' ? 'teams/explorer/projects' : 'teams/explorer/teams')}
              seconds={(who) => choicesFor(everyone.find((user) => user.id === who)!)}
              onPick={(who, membership) => {
                const user = everyone.find((one) => one.id === who)!;
                writeMemberships(user, [...(user.memberships ?? []), membership]);
              }}
            />
          ) : null}
        </Group>
      )}

      {fresh || !mayDelete(offers, grants, domain) ? null : <DangerZone label={t('teams/actions/delete')} onConfirm={() => void scena.commands.execute(domain === 'teams' ? 'ahp.deleteTeam' : 'ahp.deleteProject', { host, id })} />}
    </Page>
  );
}
