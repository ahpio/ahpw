import { describe, expect, it } from 'vitest';
import { artifactName, artifactPills, artifactSections, copyOf, openOf, readArtifacts, type Artifact } from './artifact-list.js';

const meta = (entries: unknown[]) => ({ 'agentHost/sessionArtifacts': entries });

describe('readArtifacts', () => {
  it('reads each entry on its own, newest first, and leaves out a malformed one', () => {
    const read = readArtifacts(meta([
      { id: 'a', type: 'website', label: 'Docs', isArtifact: true, link: 'https://example.com/docs' },
      { id: 'b', type: 'nonsense', label: 'Bad' },
      { id: 'c', type: 'file', label: 'notes', uri: 'file:///work/notes.md' },
      { id: 'd', type: 'issue', label: 'Bad flag', isArtifact: 'yes' },
      'not an entry',
    ]));
    expect(read.map((one) => one.id)).toEqual(['c', 'a']);
  });

  it('counts an entry with no isArtifact as an artifact, as VS Code does', () => {
    expect(readArtifacts(meta([{ id: 'x', type: 'commit', label: 'Fix', commitHash: 'abc123' }]))[0]?.isArtifact).toBe(true);
  });

  it('reads nothing from a session without the key', () => {
    expect(readArtifacts(undefined)).toEqual([]);
    expect(readArtifacts({ 'agentHost/sessionArtifacts': 'nope' })).toEqual([]);
  });
});

describe('artifactPills', () => {
  it('splits artifacts from references, and leaves a GitHub pull request to its own pill', () => {
    const { artifacts, references } = artifactPills(meta([
      { id: 'pr', type: 'pullRequest', label: 'Add docks', isArtifact: true, isGitHub: true, link: 'https://github.com/o/r/pull/7' },
      { id: 'site', type: 'website', label: 'Preview', isArtifact: true, link: 'https://example.com/' },
      { id: 'ref', type: 'pullRequest', label: 'Upstream', isArtifact: false, isGitHub: true, link: 'https://github.com/o/r/pull/9' },
    ]));
    expect(artifacts.map((one) => one.id)).toEqual(['site']);
    expect(references.map((one) => one.id)).toEqual(['ref']);
  });
});

describe('artifactSections', () => {
  it('draws the sections in VS Code order, each keeping its entries in order', () => {
    const entries: Artifact[] = [
      { id: '1', type: 'file', label: 'a', isArtifact: true },
      { id: '2', type: 'commit', label: 'b', isArtifact: true },
      { id: '3', type: 'file', label: 'c', isArtifact: true },
      { id: '4', type: 'pullRequest', label: 'd', isArtifact: true },
    ];
    expect(artifactSections(entries).map((one) => [one.type, one.entries.map((entry) => entry.id)])).toEqual([
      ['pullRequest', ['4']],
      ['commit', ['2']],
      ['file', ['1', '3']],
    ]);
  });
});

describe('an entry', () => {
  const file: Artifact = { id: 'f', type: 'file', label: 'Release notes', isArtifact: true, uri: 'file:///work/My%20Notes/notes.md' };
  const hashOnly: Artifact = { id: 'h', type: 'commit', label: 'Fix', isArtifact: true, commitHash: 'abc123' };
  const commit: Artifact = { id: 'c', type: 'commit', label: 'Fix', isArtifact: true, commitHash: 'abc123', link: 'https://github.com/o/r/commit/abc123' };
  const resource: Artifact = { id: 'r', type: 'resource', label: 'Bucket', isArtifact: false, uri: 's3://bucket/key' };

  it('names a file by its base name, and the rest by their label', () => {
    expect(artifactName(file)).toBe('notes.md');
    expect(artifactName(commit)).toBe('Fix');
  });

  it('opens a host file, a web link, and copies a commit that has only its hash', () => {
    expect(openOf(file)).toEqual({ kind: 'file', uri: 'file:///work/My%20Notes/notes.md' });
    expect(openOf(commit)).toEqual({ kind: 'web', url: 'https://github.com/o/r/commit/abc123' });
    expect(openOf(hashOnly)).toEqual({ kind: 'copy', text: 'abc123' });
    expect(openOf(resource)).toEqual({ kind: 'copy', text: 's3://bucket/key' });
  });

  it('copies a file path, a commit URL or its hash, and a resource URI', () => {
    expect(copyOf(file)?.text).toBe('/work/My Notes/notes.md');
    expect(copyOf(commit)?.text).toBe('https://github.com/o/r/commit/abc123');
    expect(copyOf(hashOnly)?.text).toBe('abc123');
    expect(copyOf(resource)?.text).toBe('s3://bucket/key');
  });
});
