import { useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Icon, Link, Popup } from '@softov/scena/ui';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { Pill } from './pills.js';
import { KIND_COLOR, PullRequestIcon } from './pull-request-icons.js';
import { chipState, hasDetails, kindOf, plainDescription, pullRequestFacts, pullRequestName, repositoryUrl, type PullRequest } from './pull-requests.js';
import './pull-requests.css';

/** How long the pointer rests on the pill before its card opens, and how long the card waits after the pointer leaves. */
const HOVER_OPEN_MS = 400;
const HOVER_CLOSE_MS = 200;
/** The space between the pill and its card. */
const HOVER_GAP = 6;

/**
 * The composer pill of a session's pull requests: the number of one, or the
 * count of several, its icon in their state's colour. With one pull request
 * GitHub has said something of, resting on the pill opens its card above it.
 */
export function PullRequestPill({ pullRequests, onOpen }: { pullRequests: readonly PullRequest[]; onOpen: () => void }): ReactElement {
  const one = pullRequests.length === 1 ? pullRequests[0] : undefined;
  const state = chipState(pullRequests);
  const kind = one === undefined ? state : kindOf(one);
  const hovers = one !== undefined && hasDetails(one);
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [at, setAt] = useState<{ x: number; y: number } | undefined>(undefined);
  const later = (run: () => void, ms: number): void => {
    clearTimeout(timer.current);
    timer.current = setTimeout(run, ms);
  };
  // Over the whole composer the pill sits in, so the card hides none of what is being written.
  const show = (): void => later(() => {
    const pill = anchor.current?.getBoundingClientRect();
    const over = anchor.current?.closest('.web-composer')?.getBoundingClientRect() ?? pill;
    if (pill !== undefined && over !== undefined) setAt({ x: pill.left, y: over.top });
  }, HOVER_OPEN_MS);
  const hide = (): void => later(() => setAt(undefined), HOVER_CLOSE_MS);
  return (
    <span
      ref={anchor}
      className="web-pr-pill"
      {...(hovers ? { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide } : {})}
    >
      <Pill
        label={one === undefined ? String(pullRequests.length) : `#${one.number}`}
        // The card says it all, so a native tooltip would only sit on top of it.
        {...(hovers ? {} : { title: one === undefined ? plural('sessions/pullRequests/count', pullRequests.length) : `${pullRequestName(one)} · ${pullRequestFacts(one)}` })}
        lead={kind === undefined
          ? <Icon name={EMOJIcon.pullRequest} size={12} />
          : <PullRequestIcon kind={kind} size={12} />}
        onOpen={() => { clearTimeout(timer.current); setAt(undefined); onOpen(); }}
      />
      {hovers && at !== undefined
        ? <HoverCard pullRequest={one} under={at} onEnter={() => clearTimeout(timer.current)} onLeave={hide} onClose={() => setAt(undefined)} />
        : null}
    </span>
  );
}

/** The card above a point, moved up by its own height once it has one. */
function HoverCard({ pullRequest, under, onEnter, onLeave, onClose }: {
  pullRequest: PullRequest;
  under: { x: number; y: number };
  onEnter: () => void;
  onLeave: () => void;
  onClose: () => void;
}): ReactElement {
  const box = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  // The popup's own height, its padding and border with it, which is what has to clear the pill.
  useLayoutEffect(() => {
    const popup = box.current?.closest<HTMLElement>('.web-pr-hover') ?? box.current;
    setHeight(popup?.offsetHeight ?? 0);
  }, [pullRequest]);
  return (
    <Popup x={under.x} y={Math.max(0, under.y - height - HOVER_GAP)} onClose={onClose} className="web-pr-hover">
      <div ref={box} onMouseEnter={onEnter} onMouseLeave={onLeave}>
        <PullRequestCard pullRequest={pullRequest} />
      </div>
    </Popup>
  );
}

/**
 * One pull request as VS Code's card shows it, from what GitHub says of it:
 * the repository and the day it opened, the title and its number, the state,
 * the description as plain text, `base ← head` and who opened it. A part the
 * host sent nothing for is left out.
 * https://github.com/microsoft/vscode/blob/6e68549edb69380c9316e49df5d3795d5064a2b0/src/vs/workbench/contrib/github/browser/githubResourceHover.ts#L131-L182
 *
 * A pull request the host sent no details for keeps the card it had: its name
 * as a link, then its repository, state and branches.
 */
export function PullRequestCard({ pullRequest }: { pullRequest: PullRequest }): ReactElement {
  const { t, locale } = useI18n();
  if (!hasDetails(pullRequest)) return <PlainCard pullRequest={pullRequest} />;
  const kind = kindOf(pullRequest);
  const opened = dayOf(pullRequest.createdAt, locale);
  const description = plainDescription(pullRequest.body);
  return (
    <div className="web-pr-card">
      <div className="web-pr-card__head">
        <Link href={repositoryUrl(pullRequest)} label={pullRequest.repository} />
        {opened === undefined ? null : <span>{` ${t('sessions/pullRequests/openedOn', { date: opened })}`}</span>}
      </div>
      <div className="web-pr-card__title">
        {pullRequest.title === undefined ? null : `${pullRequest.title} `}
        <Link href={pullRequest.url} label={`#${pullRequest.number}`} />
      </div>
      {kind === undefined ? null : (
        <Badge className="web-pr-card__state" color={KIND_COLOR[kind]} outline>
          <PullRequestIcon kind={kind} plain />
          <span>{t(`sessions/pullRequests/state/${kind}`)}</span>
        </Badge>
      )}
      <div className="web-pr-card__body" data-empty={description === undefined ? 'true' : undefined}>
        {description ?? t('sessions/pullRequests/noDescription')}
      </div>
      {pullRequest.base === undefined || pullRequest.head === undefined ? null : (
        <div className="web-pr-card__branches">
          <span className="web-pr-card__branch" title={pullRequest.base}>{pullRequest.base}</span>
          <span aria-hidden="true">{'\u2190'}</span>
          <span className="web-pr-card__branch" title={pullRequest.head}>{pullRequest.head}</span>
        </div>
      )}
      {pullRequest.author === undefined ? null : (
        <div className="web-pr-card__author">{t('sessions/pullRequests/openedBy', { login: pullRequest.author.login })}</div>
      )}
    </div>
  );
}

/** The month and day of an ISO date, as VS Code's card writes it, or nothing for one that does not read. */
function dayOf(iso: string | undefined, locale: string | undefined): string | undefined {
  if (iso === undefined) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  }
}

/** The card of a pull request the host sent no details for, as ahpw drew every card before. */
function PlainCard({ pullRequest }: { pullRequest: PullRequest }): ReactElement {
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
