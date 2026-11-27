import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Blocks, ChoicePicker, Note, Spinner } from '../../ui/index.js';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { rootId, useMe } from '../../bridges/me.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { PEOPLE, peopleReducer, readOwnUser, servesPeople, type Grant, type ListedUser, type PeopleState } from '../../bridges/people.js';
import { servesTokens } from '../../bridges/tokens.js';
import { MintForm } from './MintForm.js';
import { TokenList } from './TokenList.js';

const usersReducer = peopleReducer('users');

/** The person's own minted tokens, or, for the host itself, those of a person it picks. */
export function Keys({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  if (!servesTokens(offers)) return <Blocks><Note>{t('profile/keys/notServed')}</Note></Blocks>;
  return rootId(offers) === undefined ? <OwnKeys host={host} offers={offers} /> : <PickedKeys host={host} offers={offers} />;
}

/** *New key* above, and the list, which reads again after a mint. */
function OwnKeys({ host, offers }: { host: string; offers: Offers }): ReactElement {
  // The grants a key may be limited to: those of the person's record, without a sign-in's roles. Until they read, a key can still hold every grant.
  const [grants, setGrants] = useState<readonly Grant[]>([]);
  useEffect(() => {
    let live = true;
    readOwnUser(host, offers).then((user) => { if (live) setGrants(user.grants ?? []); }, () => undefined);
    return () => { live = false; };
  }, [host, offers]);
  return <Blocks><KeysOf host={host} grants={grants} /></Blocks>;
}

/** A person picked from the host's users, then their keys. */
function PickedKeys({ host, offers }: { host: string; offers: Offers }): ReactElement {
  const { t } = useI18n();
  const users = useChannel<PeopleState<ListedUser>>(host, servesPeople(offers, 'users') ? PEOPLE.users.channel : undefined, usersReducer);
  const [picked, setPicked] = useState('');
  const records = users.state?.records ?? [];
  const user = records.find((one) => one.id === picked)?.record;
  if (users.error !== null) return <Blocks><Note>{users.error}</Note></Blocks>;
  return (
    <Blocks>
      {users.state !== undefined && records.length === 0 ? <Note>{t('profile/keys/noPeople')}</Note> : (
        <ChoicePicker
          label={t('profile/keys/person')}
          options={[{ value: '', label: t('profile/keys/pickPerson'), disabled: true }, ...records.map((one) => ({ value: one.id, label: one.id }))]}
          value={user === undefined ? '' : picked}
          onChange={setPicked}
        />
      )}
      {user === undefined ? null : <KeysOf key={picked} host={host} user={picked} grants={user.grants ?? []} />}
    </Blocks>
  );
}

/** One person's *New key* and list; `user` names them when they are not the signed-in one. */
export function KeysOf({ host, user, grants }: { host: string; user?: string; grants: readonly Grant[] }): ReactElement {
  const { t } = useI18n();
  const me = useMe(host);
  const [reads, setReads] = useState(0);
  // A host that refuses the list, as to a reader without user:write, refuses a mint too, so New key stands aside.
  const [refused, setRefused] = useState(false);
  const whose = user === undefined ? {} : { user };
  if (me === undefined) return <Spinner label={t('profile/keys/reading')} />;
  // A host lets no key manage keys.
  if (me?.token !== undefined) return <Note>{t('profile/keys/byKey')}</Note>;
  return (
    <>
      {refused ? null : <MintForm host={host} {...whose} grants={grants} onMinted={() => setReads((one) => one + 1)} />}
      <TokenList host={host} {...whose} reads={reads} onRefused={setRefused} />
    </>
  );
}
