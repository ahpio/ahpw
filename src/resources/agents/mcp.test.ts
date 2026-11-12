import { describe, expect, it } from 'vitest';
import type { McpServerCustomization } from '@microsoft/agent-host-protocol';
import { mcpFacts } from './mcp.js';
import { stateOf } from './words.js';

const short = (uri: string): string => uri.replace('file:///home/soft/', '~/');
const server = (state: Record<string, unknown>, fields: Record<string, unknown> = {}): McpServerCustomization => ({
  type: 'mcpServer', id: 'file:///home/soft/.claude.json#mcp=tasker', uri: 'file:///home/soft/.claude.json', name: 'tasker', state, ...fields,
} as unknown as McpServerCustomization);

describe('mcpFacts', () => {
  it('gives an error its whole message and its type', () => {
    const facts = mcpFacts(server({ kind: 'error', error: { errorType: 'mcpAuthRequired', message: 'This server needs signing in.' } }), short);
    expect(facts.state).toBe('This server needs signing in.');
    expect(facts.errorType).toBe('mcpAuthRequired');
  });

  it('gives a state with no message its word, and no type', () => {
    const facts = mcpFacts(server({ kind: 'ready' }), short);
    expect(facts.state).not.toBe('ready');
    expect(facts.errorType).toBeUndefined();
  });

  it('names the file that declares a server, and the Claude account for an internal one', () => {
    expect(mcpFacts(server({ kind: 'stopped' }), short).declared).toBe('~/.claude.json');
    const internal = mcpFacts(server({ kind: 'stopped' }, { uri: 'claude-internal:/mcp/claude.ai%20Gmail' }), short);
    expect(internal.declared).not.toContain('claude-internal');
  });

  it('reads the session default from the first enablement, on when there is none', () => {
    expect(mcpFacts(server({ kind: 'ready' }), short).onInSession).toBe(true);
    expect(mcpFacts(server({ kind: 'ready' }, { enablement: [{ kind: 'session', enabled: false }] }), short).onInSession).toBe(false);
  });
});

describe('stateOf for an MCP server', () => {
  it('says an error in a short word, not its message', () => {
    const signIn = stateOf(server({ kind: 'error', error: { errorType: 'mcpAuthRequired', message: 'This server needs signing in, and it did not say where.' } }));
    const other = stateOf(server({ kind: 'error', error: { errorType: 'mcpServerFailed', message: 'spawn ENOENT' } }));
    expect(signIn?.text).not.toContain('did not say where');
    expect(other?.text).not.toContain('ENOENT');
    expect(signIn?.text).not.toBe(other?.text);
  });
});
