import { translate } from '@softov/scena';
import { hostKey } from '../../lib/storage-keys.js';

/** `_meta` key of the artifacts and references an agent recorded for a session, VS Code's name. */
export const ARTIFACTS_META = 'agentHost/sessionArtifacts';

/** What became of a pull request, as the host last saw it on GitHub. */
export type PullRequestState = 'open' | 'closed' | 'merged';

/** One GitHub pull request of a session, as the composer's chip shows it. */
export interface PullRequest {
  url: string;
  /** The number in its URL. */
  number: string;
  /** `owner/repo`, from its URL. */
  repository: string;
  /** The label the agent recorded it under; a pull request found only for the branch has none. */
  title?: string;
  /** The last state the host observed, when it observed one for this URL. */
  state?: PullRequestState;
  /** The branch it merges into, when it is the pull request of the session's branch. */
  base?: string;
  /** The branch it merges from, when it is the pull request of the session's branch. */
  head?: string;
  /** The artifact's id, which `vscode/removeSessionArtifact` takes; absent when no artifact records it. */
  artifactId?: string;
}

function bag(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

/** The strings of an array, and none of anything else. */
function stringsIn(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string') : [];
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

/** The key two spellings of one pull request URL share: case and a trailing slash. */
export const urlKey = (url: string): string => url.trim().replace(/\/+$/, '').toLowerCase();

/** `owner/repo` and the number of a GitHub pull request URL, or `undefined` for any other URL. */
function parsed(url: string): { repository: string; number: string } | undefined {
  const found = /^https?:\/\/[^/]+\/([^/]+)\/([^/]+)\/pull\/(\d+)\/?$/.exec(url.trim());
  const [, owner, repo, number] = found ?? [];
  return owner === undefined || repo === undefined || number === undefined ? undefined : { repository: `${owner}/${repo}`, number };
}

function stateOf(value: unknown): PullRequestState | undefined {
  return value === 'open' || value === 'closed' || value === 'merged' ? value : undefined;
}

/**
 * The pull requests `_meta.github` names for the session, with the branches of
 * `_meta.git`: the one found for its branch first, then the ones associated
 * with it, newest first.
 *
 * `pullRequestUrls` runs newest first, and only the newest one the session
 * owns counts: a URL in `initialPullRequestUrls` came with the checkout, unless
 * `associatedPullRequestUrls` names it too. One found for another branch than
 * `_meta.git.branchName` is not this one's, and `pullRequestState` is the state
 * of `pullRequestStateUrl` only.
 */
function githubPullRequests(meta: Record<string, unknown>): PullRequest[] {
  const found = bag(meta.github);
  const git = bag(meta.git);
  const head = text(git.branchName);
  const base = text(git.baseBranchName);
  const listed = Array.isArray(found.pullRequestUrls) ? stringsIn(found.pullRequestUrls) : stringsIn([found.pullRequestUrl]);
  const initial = new Set(stringsIn(found.initialPullRequestUrls).map(urlKey));
  const associated = stringsIn(found.associatedPullRequestUrls);
  const associatedKeys = new Set(associated.map(urlKey));
  const branch = text(found.pullRequestBranchName);
  const owned = branch !== undefined && branch !== head
    ? undefined
    : listed.find((one) => !initial.has(urlKey(one)) || associatedKeys.has(urlKey(one)));
  const stateUrl = text(found.pullRequestStateUrl);
  const pullRequests: PullRequest[] = [];
  for (const url of [...(owned === undefined ? [] : [owned]), ...associated]) {
    const where = parsed(url);
    if (where === undefined || pullRequests.some((one) => urlKey(one.url) === urlKey(url))) continue;
    const state = stateUrl !== undefined && urlKey(stateUrl) === urlKey(url) ? stateOf(found.pullRequestState) : undefined;
    pullRequests.push({
      url,
      ...where,
      ...(state === undefined ? {} : { state }),
      ...(base === undefined ? {} : { base }),
      ...(head === undefined ? {} : { head }),
    });
  }
  return pullRequests;
}

/** The GitHub pull requests an agent recorded as artifacts, newest first. */
function recordedPullRequests(meta: Record<string, unknown>): PullRequest[] {
  const list = meta[ARTIFACTS_META];
  if (!Array.isArray(list)) return [];
  const found: PullRequest[] = [];
  for (const entry of list) {
    const held = bag(entry);
    const id = text(held.id);
    const url = text(held.link);
    if (held.type !== 'pullRequest' || held.isArtifact === false || held.isGitHub === false || id === undefined || url === undefined) continue;
    const where = parsed(url);
    if (where === undefined) continue;
    const title = text(held.label);
    found.push({ url, ...where, artifactId: id, ...(title === undefined ? {} : { title }) });
  }
  return found.reverse();
}

/**
 * The GitHub pull requests of a session: the ones `_meta.github` names first,
 * then the ones its agent recorded, newest first, each once.
 *
 * A pull request in both takes the state and branches of `_meta`, and the
 * artifact's title and id.
 */
export function pullRequestsOf(meta: Record<string, unknown> | undefined): PullRequest[] {
  const held = bag(meta);
  const byKey = new Map<string, PullRequest>();
  for (const named of githubPullRequests(held)) byKey.set(urlKey(named.url), named);
  for (const recorded of recordedPullRequests(held)) {
    const key = urlKey(recorded.url);
    const known = byKey.get(key);
    byKey.set(key, known === undefined ? recorded : { ...known, ...recorded, url: known.url });
  }
  return [...byKey.values()];
}

/** A pull request as a line names it: `#248 Title`, with its repository for a title the host did not send. */
export function pullRequestName(pullRequest: PullRequest): string {
  return `#${pullRequest.number} ${pullRequest.title ?? pullRequest.repository}`;
}

/** What else is known of a pull request, in one line: its repository, its state, and `base ← head`. */
export function pullRequestFacts(pullRequest: PullRequest): string {
  return [
    pullRequest.repository,
    pullRequest.state === undefined ? undefined : translate(`sessions/pullRequests/state/${pullRequest.state}`),
    pullRequest.base === undefined || pullRequest.head === undefined ? undefined : `${pullRequest.base} \u2190 ${pullRequest.head}`,
  ].filter((one) => one !== undefined).join(' \u00B7 ');
}

/** Whether a session has pull requests and every one of them is merged. */
export function allMerged(pullRequests: readonly PullRequest[]): boolean {
  return pullRequests.length > 0 && pullRequests.every((one) => one.state === 'merged');
}

/** The colour of the pull request glyph in each state. */
export const STATE_COLOR: Record<PullRequestState, string> = { open: 'green', closed: 'red', merged: 'purple' };

/**
 * The state the pill draws for a set of pull requests, from the states the
 * host sent: open when any is, merged when any is, closed when all are, and
 * none when the host sent no state.
 */
export function chipState(pullRequests: readonly PullRequest[]): PullRequestState | undefined {
  const known = pullRequests.flatMap((one) => (one.state === undefined ? [] : [one.state]));
  if (known.includes('open')) return 'open';
  if (known.includes('merged')) return 'merged';
  return known[0];
}

/** Where the sessions whose merged banner was closed are kept, per window. */
export const MERGED_CLOSED_KEY = hostKey('ahpd-web.merged-banner-closed');

/** The sessions whose merged banner was closed, as `refKey(host, resource)`. */
export function readMergedClosed(): string[] {
  try {
    return stringsIn(JSON.parse(localStorage.getItem(MERGED_CLOSED_KEY) ?? '[]') as unknown);
  } catch {
    return [];
  }
}

/** Keep the merged banner of session `key` closed. */
export function closeMerged(key: string): void {
  const held = readMergedClosed();
  if (held.includes(key)) return;
  try {
    localStorage.setItem(MERGED_CLOSED_KEY, JSON.stringify([...held, key]));
  } catch {
    // Not kept, which only means the banner shows again on the next page load.
  }
}
