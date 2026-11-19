import type { SessionState, SessionSummary } from '@microsoft/agent-host-protocol';

/**
 * The row of a session the host does not list yet, from its own state: its
 * metadata, with no times, since the state carries none. A session made with
 * no message is held but not listed until its first turn.
 */
export function unlistedSummary(resource: string, state: SessionState): SessionSummary {
  const { lifecycle: _lifecycle, creationError: _error, serverTools: _tools, activeClients: _clients, chats: _chats, config: _config, customizations: _customizations, changesets: _changesets, ...metadata } = state;
  return { ...metadata, resource, createdAt: '', modifiedAt: '' };
}
