import { describe, expect, it } from 'vitest';
import { allMerged, ARTIFACTS_META, chipState, pullRequestFacts, pullRequestName, pullRequestsOf } from './pull-requests.js';

const URL_A = 'https://github.com/example/repo/pull/248';
const URL_B = 'https://github.com/example/repo/pull/251';

const branchMeta = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  git: { branchName: 'agents/one', baseBranchName: 'main' },
  github: { pullRequestUrls: [URL_A], pullRequestBranchName: 'agents/one', pullRequestState: 'merged', pullRequestStateUrl: URL_A, ...extra },
});

describe('pullRequestsOf', () => {
  it('reads the pull request of the branch, with its state and branches', () => {
    expect(pullRequestsOf(branchMeta())).toEqual([
      { url: URL_A, repository: 'example/repo', number: '248', state: 'merged', base: 'main', head: 'agents/one' },
    ]);
  });

  it('leaves out a pull request found for another branch', () => {
    expect(pullRequestsOf(branchMeta({ pullRequestBranchName: 'agents/two' }))).toEqual([]);
  });

  it('leaves out a state that is of another URL', () => {
    expect(pullRequestsOf(branchMeta({ pullRequestStateUrl: URL_B }))[0]?.state).toBeUndefined();
  });

  it('skips a pull request that came with the checkout, unless it is associated', () => {
    expect(pullRequestsOf(branchMeta({ initialPullRequestUrls: [URL_A] }))).toEqual([]);
    expect(pullRequestsOf(branchMeta({ initialPullRequestUrls: [URL_A], associatedPullRequestUrls: [URL_A] }))).toHaveLength(1);
  });

  it('adds the recorded pull requests, newest first, and merges one the branch has', () => {
    const meta = {
      ...branchMeta(),
      [ARTIFACTS_META]: [
        { id: 'a1', type: 'pullRequest', label: 'First', isArtifact: true, link: `${URL_A}/`, isGitHub: true },
        { id: 'a2', type: 'pullRequest', label: 'Second', isArtifact: true, link: URL_B, isGitHub: true },
      ],
    };
    expect(pullRequestsOf(meta)).toEqual([
      { url: URL_A, repository: 'example/repo', number: '248', state: 'merged', base: 'main', head: 'agents/one', title: 'First', artifactId: 'a1' },
      { url: URL_B, repository: 'example/repo', number: '251', title: 'Second', artifactId: 'a2' },
    ]);
  });

  it('skips references, other hosts, other kinds and malformed entries', () => {
    const meta = {
      [ARTIFACTS_META]: [
        { id: 'r', type: 'pullRequest', label: 'A reference', isArtifact: false, link: URL_A },
        { id: 'g', type: 'pullRequest', label: 'Not GitHub', isArtifact: true, link: URL_A, isGitHub: false },
        { id: 'i', type: 'issue', label: 'An issue', isArtifact: true, link: 'https://github.com/example/repo/issues/1' },
        { type: 'pullRequest', label: 'No id', link: URL_A },
        'nonsense',
      ],
    };
    expect(pullRequestsOf(meta)).toEqual([]);
  });

  it('reads an associated pull request with the session\'s branches, and no state it was not given', () => {
    const meta = {
      git: { branchName: 'agents/one', baseBranchName: 'main' },
      github: { owner: 'example', repo: 'repo', initialPullRequestUrls: [], associatedPullRequestUrls: [URL_A] },
      [ARTIFACTS_META]: [{ id: 'a1', type: 'pullRequest', label: 'First', isArtifact: true, link: URL_A, isGitHub: true }],
    };
    expect(pullRequestsOf(meta)).toEqual([
      { url: URL_A, repository: 'example/repo', number: '248', base: 'main', head: 'agents/one', title: 'First', artifactId: 'a1' },
    ]);
  });

  it('reads nothing from a session without the keys', () => {
    expect(pullRequestsOf(undefined)).toEqual([]);
    expect(pullRequestsOf({ github: 'nonsense', git: 3 })).toEqual([]);
  });
});

describe('allMerged and chipState', () => {
  const merged = { url: URL_A, repository: 'example/repo', number: '248', state: 'merged' as const };
  const open = { url: URL_B, repository: 'example/repo', number: '251', state: 'open' as const };
  const unknown = { url: URL_B, repository: 'example/repo', number: '251' };

  it('is merged only when every pull request is', () => {
    expect(allMerged([merged])).toBe(true);
    expect(allMerged([merged, open])).toBe(false);
    expect(allMerged([merged, unknown])).toBe(false);
    expect(allMerged([])).toBe(false);
  });

  it('draws from the states the host sent: open, then merged, then closed, else nothing', () => {
    const closed = { ...unknown, state: 'closed' as const };
    expect(chipState([merged])).toBe('merged');
    expect(chipState([merged, open])).toBe('open');
    expect(chipState([merged, unknown])).toBe('merged');
    expect(chipState([closed, merged])).toBe('merged');
    expect(chipState([closed, unknown])).toBe('closed');
    expect(chipState([unknown])).toBeUndefined();
  });
});

describe('pullRequestName and pullRequestFacts', () => {
  const full = { url: URL_A, repository: 'example/repo', number: '248', title: 'A view', state: 'merged' as const, base: 'main', head: 'agents/one' };

  it('names a pull request by number and title, or by repository', () => {
    expect(pullRequestName(full)).toBe('#248 A view');
    expect(pullRequestName({ url: URL_A, repository: 'example/repo', number: '248' })).toBe('#248 example/repo');
  });

  it('says the repository, state and branches it knows', () => {
    expect(pullRequestFacts(full)).toBe('example/repo · Merged · main ← agents/one');
    expect(pullRequestFacts({ url: URL_A, repository: 'example/repo', number: '248' })).toBe('example/repo');
  });
});
