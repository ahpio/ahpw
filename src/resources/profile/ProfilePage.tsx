import type { ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Page, Text } from '../../ui/index.js';
import { KeptTabs } from '../../ui/navigation/KeptTabs.js';
import { ahpPaths } from '../../bridges/data.js';
import { profileOf } from '../../bridges/me.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { personUri } from '../../bridges/people.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { EMOJIcon } from '../emojis.js';
import { Info } from './Info.js';
import { Keys } from './Keys.js';
import { keepProfileTabKey, profileTabKey } from './state.js';
import { PageTitle } from '../../shell/HostIcon.js';

/** The signed-in person on one host, or the host itself: who they are and what they used, and keys. */
export default function ProfilePage({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const whose = profileOf(offers);
  if (whose === undefined) return <PageAlert tone="warning" message={t('profile/notices/notPerson')} />;

  return (
    <Page>
      {whose.kind === 'user'
        ? <PageTitle emoji={EMOJIcon.users} title={whose.id} uri={personUri(offers, 'users', whose.id)} />
        : <PageTitle emoji={EMOJIcon.host} title={whose.id} uri={`root:${whose.id}`} />}
      <KeptTabs
        tabs={[
          { key: 'info', title: t('profile/tabs/info'), child: <Info host={host} /> },
          { key: 'keys', title: t('profile/tabs/keys'), child: <Keys host={host} /> },
        ]}
        defaultValue={profileTabKey()}
        onChange={keepProfileTabKey}
      />
    </Page>
  );
}
