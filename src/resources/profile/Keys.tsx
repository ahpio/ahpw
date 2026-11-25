import { useEffect, useState, type ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Spinner } from '@softov/scena/ui';
import { useChannel } from '../../bridges/channel.js';
import { ahpPaths } from '../../bridges/data.js';
import { rootId, useMe } from '../../bridges/me.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { PEOPLE, peopleReducer, readOwnUser, servesPeople, type Grant, type ListedUser, type PeopleState } from '../../bridges/people.js';
import { servesTokens } from '../../bridges/tokens.js';
import { Field } from '../../shell/view/Field.js';
import { MintForm } from './MintForm.js';
import { TokenList } from './TokenList.js';

const usersReducer = peopleReducer('users');

/** The person's own minted tokens, or, for the host itself, those of a person it picks. */
export function Keys({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  if (!servesTokens(offers)) return <div className="web-profile__keys"><p className="web-note">{t('profile/keys/notServed')}</p></div>;
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
  return <div className="web-profile__keys"><KeysOf host={host} grants={grants} /></div>;
}

/** A person picked from the host's users, then their keys. */
function PickedKeys({ host, offers }: { host: string; offers: Offers }): ReactElement {
  const { t } = useI18n();
  const users = useChannel<PeopleState<ListedUser>>(host, servesPeople(offers, 'users') ? PEOPLE.users.channel : undefined, usersReducer);
  const [picked, setPicked] = useState('');
  const records = users.state?.records ?? [];
  const user = records.find((one) => one.id === picked)?.record;
  if (users.error !== null) return <div className="web-profile__keys"><p className="web-note">{users.error}</p></div>;
  return (
    <div className="web-profile__keys">
      {users.state !== undefined && records.length === 0 ? <p className="web-note">{t('profile/keys/noPeople')}</p> : (
        <Field label={t('profile/keys/person')}>
          <select className="web-field" value={user === undefined ? '' : picked} onChange={(event) => setPicked(event.target.value)}>
            <option value="" disabled>{t('profile/keys/pickPerson')}</option>
            {records.map((one) => <option key={one.id} value={one.id}>{one.id}</option>)}
          </select>
        </Field>
      )}
      {user === undefined ? null : <KeysOf key={picked} host={host} user={picked} grants={user.grants ?? []} />}
    </div>
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
  if (me?.token !== undefined) return <p className="web-note">{t('profile/keys/byKey')}</p>;
  return (
    <>
      {refused ? null : <MintForm host={host} {...whose} grants={grants} onMinted={() => setReads((one) => one + 1)} />}
      <TokenList host={host} {...whose} reads={reads} onRefused={setRefused} />
    </>
  );
}
