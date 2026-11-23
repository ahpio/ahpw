import { describe, expect, it } from 'vitest';
import type { CustomizationEnablement, McpServerCustomization, McpServerState, PluginCustomization, SessionActiveClient, SessionState, SkillCustomization, ToolDefinition } from '@microsoft/agent-host-protocol';
import { clientName, offWord, onAt, otherClients, pluginGroups, searchRows, searchTools, serverGroups, toolGroups, toolHints, toolParams, withDecision } from './tooling.js';

const tool = (name: string, fields: Partial<ToolDefinition> = {}): ToolDefinition => ({ name, ...fields });
const client = (clientId: string, fields: Partial<SessionActiveClient> = {}): SessionActiveClient => ({ clientId, tools: [], ...fields });
const session = (fields: Partial<SessionState>): SessionState => ({ activeClients: [], ...fields } as unknown as SessionState);
const mcp = (fields: Partial<McpServerCustomization> = {}): McpServerCustomization => ({ type: 'mcpServer' as McpServerCustomization['type'], id: 'm', uri: 'claude-internal:/mcp/tasker', name: 'tasker', state: { kind: 'stopped' } as unknown as McpServerState, ...fields });
const plugin = (fields: Partial<PluginCustomization & { clientId: string }>): PluginCustomization => ({ type: 'plugin' as PluginCustomization['type'], id: 'p', uri: 'file:///home/ana/.plugins/tidy', name: 'tidy', ...fields });
const skill = (id: string): SkillCustomization => ({ type: 'skill' as SkillCustomization['type'], id, uri: `file:///x/${id}/SKILL.md`, name: id });
const decision = (kind: string, enabled: boolean, uri?: string): CustomizationEnablement => ({ kind, enabled, ...(uri === undefined ? {} : { uri }) } as unknown as CustomizationEnablement);

describe('clients', () => {
  it('names a client by its display name, else by the start of its id', () => {
    expect(clientName(client('40a84bca-eb79', { displayName: 'VS Code' }))).toBe('VS Code');
    expect(clientName(client('40a84bca-eb79'))).toBe('Client 40a84bca');
  });

  it('leaves this window out of the other clients', () => {
    const state = session({ activeClients: [client('mine'), client('vscode')] });
    expect(otherClients(state, 'mine').map((one) => one.clientId)).toEqual(['vscode']);
    expect(otherClients(undefined, 'mine')).toEqual([]);
  });
});

describe('toolGroups', () => {
  it('groups the host tools first, then each client with tools', () => {
    const state = session({ serverTools: [tool('list_sessions')], activeClients: [client('empty'), client('vscode', { tools: [tool('readPage')] })] });
    expect(toolGroups(state).map((group) => [group.key, group.title, group.tools.map((one) => one.name)])).toEqual([
      ['host', 'Host', ['list_sessions']],
      ['client:vscode', 'Client vscode', ['readPage']],
    ]);
  });

  it('finds tools by name, title or description and drops a group left empty', () => {
    const groups = toolGroups(session({ serverTools: [tool('list_sessions', { title: 'List Sessions' }), tool('plan_create', { description: 'Make a plan.' })], activeClients: [client('c', { tools: [tool('readPage')] })] }));
    expect(searchTools(groups, 'PLAN').map((group) => group.tools.map((one) => one.name))).toEqual([['plan_create']]);
    expect(searchTools(groups, 'list s').map((group) => group.tools.map((one) => one.name))).toEqual([['list_sessions']]);
    expect(searchTools(groups, '  ')).toHaveLength(2);
  });
});

describe('toolParams and toolHints', () => {
  it('lists inputs in schema order with type, required and description', () => {
    const plan = tool('plan_create', {
      inputSchema: {
        type: 'object',
        properties: { title: { type: 'string', description: 'One line.' }, refs: { type: 'array', items: { type: 'string' } }, scope: { type: 'object' }, any: {} },
        required: ['title', 'scope'],
      },
    });
    expect(toolParams(plan)).toEqual([
      { name: 'title', type: 'string', required: true, description: 'One line.' },
      { name: 'refs', type: 'string[]', required: false, description: '' },
      { name: 'scope', type: 'object', required: true, description: '' },
      { name: 'any', type: '', required: false, description: '' },
    ]);
    expect(toolParams(tool('bare'))).toEqual([]);
  });

  it('says only the hints the host set', () => {
    expect(toolHints(tool('a'))).toEqual([]);
    expect(toolHints(tool('a', { annotations: { readOnlyHint: true, destructiveHint: true, openWorldHint: false } }))).toEqual(['Read only']);
    expect(toolHints(tool('a', { annotations: { readOnlyHint: false, destructiveHint: false } }))).toEqual(['Changes things', 'Not destructive']);
    expect(toolHints(tool('a', { annotations: { destructiveHint: true, openWorldHint: true } }))).toEqual(['Destructive', 'Reaches outside']);
  });
});

describe('serverGroups', () => {
  it('puts the host servers first, then each plugin with servers, with where each is declared', () => {
    const groups = serverGroups([
      plugin({ id: 'vs', name: 'VS Code Standalone', children: [skill('lint'), mcp({ id: 'gh', name: 'GitHub', uri: 'file:///home/ana/.config/mcp.json', range: { start: { line: 4, character: 0 }, end: { line: 9, character: 0 } } })] }),
      plugin({ id: 'empty', children: [skill('x')] }),
      mcp({ enablement: [decision('session', false)] }),
    ]);
    expect(groups.map((group) => [group.key, group.title, group.note, group.rows.map((row) => row.name)])).toEqual([
      ['host', 'Host', '', ['tasker']],
      ['vs', 'VS Code Standalone', 'plugin', ['GitHub']],
    ]);
    const [tasker] = groups[0]!.rows;
    expect(tasker).toMatchObject({ enabled: false, decidedAt: 'session', lifecycle: 'stopped', line: 'Claude CLI' });
    expect(tasker!.open).toBeUndefined();
    expect(groups[1]!.rows[0]).toMatchObject({ enabled: true, line: '~/.config/mcp.json', open: { uri: 'file:///home/ana/.config/mcp.json', line: 5 } });
  });

  it('finds rows by name', () => {
    const groups = serverGroups([mcp(), mcp({ id: 'a', name: 'ahpd' })]);
    expect(searchRows(groups, 'AHP').flatMap((group) => group.rows.map((row) => row.name))).toEqual(['ahpd']);
    expect(searchRows(groups, 'none')).toEqual([]);
  });
});

describe('pluginGroups', () => {
  it('groups plugins by the client that sent them, the host first, and says what each holds', () => {
    const groups = pluginGroups([
      plugin({ id: 'orb', name: 'color-orb', clientId: 'vscode', children: [] }),
      plugin({ id: 'synced', name: 'Synced', clientId: 'vscode', children: [skill('a'), skill('b'), mcp()], enablement: [decision('global', false)] }),
      plugin({ id: 'own', name: 'house' }),
      mcp(),
    ], [client('vscode', { displayName: 'VS Code' })]);
    expect(groups.map((group) => [group.title, group.rows.map((row) => [row.name, row.line, row.enabled])])).toEqual([
      ['Host', [['house', '', true]]],
      ['VS Code', [['color-orb', 'Empty', true], ['Synced', '2 skills · 1 MCP server', false]]],
    ]);
    expect(offWord(groups[1]!.rows[1]!)).toBe('Off (Everywhere)');
  });

  it('names a client that is gone by its id', () => {
    expect(pluginGroups([plugin({ clientId: '40a84bca-eb79' })], [])[0]!.title).toBe('Client 40a84bca');
  });
});

describe('withDecision', () => {
  const sent = [decision('global', true)];

  it('sets the session decision and keeps the others, most specific first', () => {
    expect(withDecision(sent, 'session', false, '/work')).toEqual([decision('session', false), decision('global', true)]);
  });

  it('replaces the decision already made at that scope', () => {
    expect(withDecision([decision('session', false), decision('global', true)], 'session', true, undefined)).toEqual([decision('session', true), decision('global', true)]);
    expect(withDecision(sent, 'global', false, undefined)).toEqual([decision('global', false)]);
  });

  it('names the folder in a folder decision, and makes none without a folder', () => {
    expect(withDecision(sent, 'workspace', false, 'file:///work')).toEqual([decision('workspace', false, 'file:///work'), decision('global', true)]);
    expect(withDecision(sent, 'workspace', false, undefined)).toEqual(sent);
  });

  it('reads a row as on at a scope from the decision there, else what holds', () => {
    const [row] = serverGroups([mcp({ enablement: [decision('session', false), decision('global', true)] })])[0]!.rows;
    expect(onAt(row!, 'session')).toBe(false);
    expect(onAt(row!, 'global')).toBe(true);
    expect(onAt(row!, 'workspace')).toBe(false);
    expect(offWord(row!)).toBe('Off (Session)');
  });
});
