import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, DetailList, Icon, Link } from '@softov/scena/ui';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { Pill } from './pills.js';
import { chipState, pullRequestFacts, pullRequestName, STATE_COLOR, type PullRequest } from './pull-requests.js';
import './pull-requests.css';

/** The composer pill of a session's pull requests: the number of one, or the count of several, its glyph in their state's colour. */
export function PullRequestPill({ pullRequests, onOpen }: { pullRequests: readonly PullRequest[]; onOpen: () => void }): ReactElement {
  const one = pullRequests.length === 1 ? pullRequests[0] : undefined;
  const state = chipState(pullRequests);
  return (
    <Pill
      label={one === undefined ? String(pullRequests.length) : `#${one.number}`}
      title={one === undefined ? plural('sessions/pullRequests/count', pullRequests.length) : `${pullRequestName(one)} · ${pullRequestFacts(one)}`}
      lead={<Icon name={EMOJIcon.pullRequest} size={12} {...(state === undefined ? {} : { color: STATE_COLOR[state] })} />}
      onOpen={onOpen}
    />
  );
}

/**
 * What is known of one pull request, as the header of its picker: its name,
 * a link to its page, then its repository, state and branches, where the host
 * sent them.
 */
export function PullRequestCard({ pullRequest }: { pullRequest: PullRequest }): ReactElement {
  const { t } = useI18n();
  const facts = [
    { label: t('sessions/pullRequests/repository'), value: pullRequest.repository },
    ...(pullRequest.state === undefined ? [] : [{ label: t('sessions/pullRequests/status'), value: t(`sessions/pullRequests/state/${pullRequest.state}`) }]),
    ...(pullRequest.base === undefined || pullRequest.head === undefined ? [] : [{ label: t('sessions/pullRequests/branches'), value: `${pullRequest.base} \u2190 ${pullRequest.head}` }]),
  ];
  return (
    <>
      <Link href={pullRequest.url} label={pullRequestName(pullRequest)} external />
      <DetailList items={facts} />
    </>
  );
}

/**
 * The banner over the composer once every pull request of the session is
 * merged: what merged, and *Archive*. Closing it keeps it closed for the session.
 */
export function MergedBanner({ pullRequests, onArchive, onClose }: { pullRequests: readonly PullRequest[]; onArchive: () => void; onClose: () => void }): ReactElement {
  const { t } = useI18n();
  return (
    <Alert className="web-merged" icon={EMOJIcon.pullRequest} title={plural('sessions/pullRequests/merged', pullRequests.length)} onClose={onClose}>
      {pullRequests.map((pullRequest) => <span key={pullRequest.url}>{`${pullRequestName(pullRequest)} · ${pullRequestFacts(pullRequest)}`}</span>)}
      <span>{t('sessions/pullRequests/archiveNote')}</span>
      <span><Button label={t('sessions/pullRequests/archive')} variant="primary" size="sm" onClick={onArchive} /></span>
    </Alert>
  );
}
