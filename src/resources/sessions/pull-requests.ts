import { translate } from '@softov/scena';
import { hostKey } from '../../lib/storage-keys.js';

/** `_meta` key of the artifacts and references an agent recorded for a session, VS Code's name. */
export const ARTIFACTS_META = 'agentHost/sessionArtifacts';

/** `_meta` key of what GitHub says of each pull request a session shows, keyed by its URL; ahpd's own. */
export const PULL_REQUESTS_META = 'ahpd.pullRequests';

/** What became of a pull request, as the host last saw it on GitHub. */
export type PullRequestState = 'open' | 'closed' | 'merged';

/** One GitHub pull request of a session, as the composer's chip shows it. */
export interface PullRequest {
  url: string;
  /** The number in its URL. */
  number: string;
  /** `owner/repo`, from its URL. */
  repository: string;
  /** Its title on GitHub when the host sent it, else the label the agent recorded it under; one found only for the branch has neither. */
  title?: string;
  /** The last state the host observed, when it observed one for this URL. */
  state?: PullRequestState;
  /** The branch it merges into: GitHub's when the host sent it, else the session folder's base for the branch's pull request. */
  base?: string;
  /** The branch it merges from: GitHub's when the host sent it, else the session folder's branch for the branch's pull request. */
  head?: string;
  /** The artifact's id, which `vscode/removeSessionArtifact` takes; absent when no artifact records it. */
  artifactId?: string;
  /** Its description, as its author wrote it in Markdown; the host sends at most 1000 characters. */
  body?: string;
  /** Whether the host cut the description. */
  bodyTruncated?: boolean;
  /** Whether it is a draft. */
  isDraft?: boolean;
  /** Who opened it. */
  author?: { login: string };
  /** When it was opened, last changed, merged and closed, ISO 8601. */
  createdAt?: string;
  updatedAt?: string;
  mergedAt?: string;
  closedAt?: string;
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
 * What `_meta['ahpd.pullRequests']` says of the pull request at `url`, each
 * field kept only when it has the right type.
 */
export function detailsOf(meta: Record<string, unknown>, url: string): Partial<PullRequest> {
  const all = bag(meta[PULL_REQUESTS_META]);
  const key = urlKey(url);
  const found = Object.entries(all).find(([one]) => urlKey(one) === key)?.[1];
  if (found === undefined) return {};
  const held = bag(found);
  const author = bag(held.author);
  const login = text(author.login);
  const state = stateOf(held.state);
  const fields: Partial<PullRequest> = {
    ...(state === undefined ? {} : { state }),
    ...(held.bodyTruncated === true ? { bodyTruncated: true } : {}),
    ...(typeof held.isDraft === 'boolean' ? { isDraft: held.isDraft } : {}),
    ...(login === undefined ? {} : { author: { login } }),
  };
  // Each text field under the name `PullRequest` gives it, from the name the host sends.
  const texts = [['title', 'title'], ['base', 'baseRef'], ['head', 'headRef'], ['body', 'body'],
    ['createdAt', 'createdAt'], ['updatedAt', 'updatedAt'], ['mergedAt', 'mergedAt'], ['closedAt', 'closedAt']] as const;
  for (const [to, from] of texts) {
    const value = text(held[from]);
    if (value !== undefined) fields[to] = value;
  }
  return fields;
}

/**
 * The GitHub pull requests of a session: the ones `_meta.github` names first,
 * then the ones its agent recorded, newest first, each once.
 *
 * A pull request in both takes the state and branches of `_meta`, and the
 * artifact's title and id. What `_meta['ahpd.pullRequests']` says of one wins
 * over both for its state, title and branches: GitHub's words over the
 * agent's label. One the host sent nothing for stays as the two make it.
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
  return [...byKey.values()].map((one) => ({ ...one, ...detailsOf(held, one.url) }));
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

/**
 * A pull request's state as its card shows it, VS Code's order: merged, then
 * closed, then an open draft, then open; none when the host sent no state.
 * https://github.com/microsoft/vscode/blob/6e68549edb69380c9316e49df5d3795d5064a2b0/src/vs/workbench/contrib/github/browser/githubResourceHover.ts#L223-L234
 */
export function kindOf(pullRequest: PullRequest): 'open' | 'draft' | 'merged' | 'closed' | undefined {
  if (pullRequest.state === 'open' && pullRequest.isDraft === true) return 'draft';
  return pullRequest.state;
}

/** Whether the host sent what GitHub says of a pull request, and not only its URL and state. */
export function hasDetails(pullRequest: PullRequest): boolean {
  return pullRequest.author !== undefined || pullRequest.createdAt !== undefined || pullRequest.isDraft !== undefined || pullRequest.body !== undefined;
}

/** The longest description a card shows, VS Code's. */
export const DESCRIPTION_LIMIT = 200;

/**
 * A description as a card shows it: plain text with no Markdown marks, its
 * white space joined, cut at `DESCRIPTION_LIMIT` with `…`, or nothing when no
 * text is left. VS Code renders it as plain text the same way.
 * https://github.com/microsoft/vscode/blob/6e68549edb69380c9316e49df5d3795d5064a2b0/src/vs/workbench/contrib/github/browser/githubResourceHover.ts#L240-L243
 */
export function plainDescription(body: string | undefined): string | undefined {
  if (body === undefined) return undefined;
  const plain = body
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/```[^\n]*\n?/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
    .replace(/(\*\*|__|\*|_|~~|`)(?=\S)([^\n]*?\S)\1/g, '$2')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain === '') return undefined;
  const chars = Array.from(plain);
  return chars.length <= DESCRIPTION_LIMIT ? plain : `${chars.slice(0, DESCRIPTION_LIMIT).join('').trimEnd()}\u2026`;
}

/** The repository's page on the host its pull request is on. */
export function repositoryUrl(pullRequest: PullRequest): string {
  const found = /^(https?:\/\/[^/]+)\//.exec(pullRequest.url.trim());
  return `${found?.[1] ?? 'https://github.com'}/${pullRequest.repository}`;
}

/** Whether a session has pull requests and every one of them is merged. */
export function allMerged(pullRequests: readonly PullRequest[]): boolean {
  return pullRequests.length > 0 && pullRequests.every((one) => one.state === 'merged');
}

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
