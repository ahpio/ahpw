/**
 * The artifacts and references an agent recorded for a session, read from the
 * session's `_meta` as VS Code reads them: one list, told apart by
 * `isArtifact`, each entry checked on its own and listed newest first.
 */

import { translate } from '@softov/scena';
import { EMOJIcon } from '../emojis.js';
import { ARTIFACTS_META, pullRequestsOf, urlKey } from './pull-requests.js';

export type ArtifactType = 'pullRequest' | 'issue' | 'commit' | 'website' | 'file' | 'resource';

/** The types in the order a list draws its sections, as VS Code orders them. */
export const ARTIFACT_TYPES: readonly ArtifactType[] = ['pullRequest', 'issue', 'commit', 'website', 'file', 'resource'];

/** One entry as ahpd sends it under `agentHost/sessionArtifacts`. */
export interface Artifact {
  id: string;
  type: ArtifactType;
  label: string;
  /** Something the session made; `false` is a reference, something it only points at. */
  isArtifact: boolean;
  link?: string;
  uri?: string;
  commitHash?: string;
  isGitHub?: boolean;
}

const isType = (value: unknown): value is ArtifactType => typeof value === 'string' && (ARTIFACT_TYPES as readonly string[]).includes(value);

/**
 * One entry, or nothing when it is malformed. An entry with no `isArtifact` is
 * one recorded before artifacts and references were told apart, which was
 * always an artifact.
 */
function parsed(value: unknown): Artifact | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== 'string' || typeof raw.label !== 'string' || !isType(raw.type)) return undefined;
  if (raw.isArtifact !== undefined && typeof raw.isArtifact !== 'boolean') return undefined;
  return {
    id: raw.id,
    type: raw.type,
    label: raw.label,
    isArtifact: raw.isArtifact ?? true,
    ...(typeof raw.link === 'string' ? { link: raw.link } : {}),
    ...(typeof raw.uri === 'string' ? { uri: raw.uri } : {}),
    ...(typeof raw.commitHash === 'string' ? { commitHash: raw.commitHash } : {}),
    ...(typeof raw.isGitHub === 'boolean' ? { isGitHub: raw.isGitHub } : {}),
  };
}

/** Every well-formed entry of a session's `_meta`, newest first. */
export function readArtifacts(meta: Record<string, unknown> | undefined): Artifact[] {
  const list = meta?.[ARTIFACTS_META];
  if (!Array.isArray(list)) return [];
  return list.map(parsed).filter((one): one is Artifact => one !== undefined).reverse();
}

/**
 * What the composer's two pills list. A GitHub pull request the pull request
 * pill shows is left out of the artifacts, as VS Code gives it its own pill;
 * a reference always stays with the references.
 */
export function artifactPills(meta: Record<string, unknown> | undefined): { artifacts: Artifact[]; references: Artifact[] } {
  const entries = readArtifacts(meta);
  const shown = new Set(pullRequestsOf(meta).map((one) => urlKey(one.url)));
  return {
    artifacts: entries.filter((one) => one.isArtifact && (one.link === undefined || !shown.has(urlKey(one.link)))),
    references: entries.filter((one) => !one.isArtifact),
  };
}

/** The entries in sections, in VS Code's order; a type with no entry has no section. */
export function artifactSections(entries: readonly Artifact[]): { type: ArtifactType; entries: Artifact[] }[] {
  return ARTIFACT_TYPES.map((type) => ({ type, entries: entries.filter((one) => one.type === type) })).filter((one) => one.entries.length > 0);
}

const isWeb = (value: string | undefined): value is string => value !== undefined && /^https?:\/\//i.test(value);
const isFileUri = (value: string | undefined): value is string => value !== undefined && /^file:\/\//i.test(value);

/** A `file:` URI as a path, decoded; any other URI as it is. */
export function pathOf(uri: string): string {
  if (!isFileUri(uri)) return uri;
  try {
    return decodeURIComponent(new URL(uri).pathname);
  } catch {
    return uri;
  }
}

/** What an entry is called in a list: a file by its base name, the rest by their label. */
export function artifactName(one: Artifact): string {
  if (one.type !== 'file' || one.uri === undefined) return one.label;
  return pathOf(one.uri).split('/').filter((part) => part !== '').at(-1) ?? one.label;
}

/** The glyph of each type, after VS Code's codicons. */
export const ARTIFACT_ICON: Record<ArtifactType, string> = {
  pullRequest: EMOJIcon.pullRequest,
  issue: '◉',
  commit: EMOJIcon.commit,
  website: '🌐︎',
  file: EMOJIcon.file,
  resource: EMOJIcon.link,
};

/** What a click on an entry does: open a web page, open a host file, or copy what there is to copy. */
export type ArtifactOpen = { kind: 'web'; url: string } | { kind: 'file'; uri: string } | { kind: 'copy'; text: string } | { kind: 'none' };

export function openOf(one: Artifact): ArtifactOpen {
  if (one.type === 'file' || one.type === 'resource') {
    if (isFileUri(one.uri)) return { kind: 'file', uri: one.uri };
    if (isWeb(one.uri)) return { kind: 'web', url: one.uri };
    return one.uri === undefined ? { kind: 'none' } : { kind: 'copy', text: one.uri };
  }
  if (isWeb(one.link)) return { kind: 'web', url: one.link };
  // A commit with only its hash: VS Code copies the hash.
  if (one.commitHash !== undefined) return { kind: 'copy', text: one.commitHash };
  return { kind: 'none' };
}

/** What an entry's copy button copies, and its label in VS Code's words; nothing when there is nothing to copy. */
export function copyOf(one: Artifact): { text: string; label: string } | undefined {
  if (one.type === 'file') return one.uri === undefined ? undefined : { text: pathOf(one.uri), label: translate('sessions/artifacts/copyPath') };
  if (one.type === 'resource') return one.uri === undefined ? undefined : { text: one.uri, label: translate('sessions/artifacts/copyUri') };
  if (one.type === 'commit') {
    if (one.link !== undefined) return { text: one.link, label: translate('sessions/artifacts/copyCommitUrl') };
    return one.commitHash === undefined ? undefined : { text: one.commitHash, label: translate('sessions/artifacts/copyCommitHash') };
  }
  if (one.link === undefined) return undefined;
  const word = one.type === 'pullRequest' ? 'copyPullRequestUrl' : one.type === 'issue' ? 'copyIssueUrl' : 'copyWebsiteUrl';
  return { text: one.link, label: translate(`sessions/artifacts/${word}`) };
}
