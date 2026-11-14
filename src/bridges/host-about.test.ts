import { expect, test } from 'vitest';
import { aboutOf, memoryWords, NO_ABOUT, rootMetaOf } from './host-about.js';

const META = {
  hostBuild: { version: '0.15.0-rc.3' },
  'vscode.agentHost.resources': { platform: 'linux', architecture: 'x64', cpuCount: 8, memoryBytes: 16775348224 },
  'vscode.agentCustomizationSettings': [
    { provider: 'sandbox', title: 'Agent Sandbox', description: 'Where commands run.', settings: [{ key: 'sandbox', group: 'Agent Sandbox' }] },
    { title: 'No provider' },
  ],
};

test('the build, the machine and each settings page a root _meta names', () => {
  expect(aboutOf(META)).toEqual({
    build: '0.15.0-rc.3',
    machine: { platform: 'linux', architecture: 'x64', cpus: 8, memoryBytes: 16775348224 },
    settings: [{ provider: 'sandbox', title: 'Agent Sandbox', description: 'Where commands run.', keys: ['sandbox'] }],
  });
  expect(memoryWords(16775348224)).toBe('15.6 GiB');
});

test('a host that names none of them, or sends no _meta', () => {
  expect(aboutOf({ 'ahpd.principal': 'root:box', 'vscode.agentHost.resources': {} })).toEqual(NO_ABOUT);
  expect(aboutOf(undefined)).toEqual(NO_ABOUT);
});

test('the root _meta in an initialize answer, among its snapshots', () => {
  const result = { snapshots: [{ resource: 'ahp-session:/a', state: { _meta: { other: true } } }, { resource: 'ahp-root://', state: { agents: [], _meta: META } }] };
  expect(rootMetaOf(result, 'ahp-root://')).toBe(META);
  expect(rootMetaOf({}, 'ahp-root://')).toBeUndefined();
});
