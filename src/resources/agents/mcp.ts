import type { McpServerAuthRequiredState, McpServerCustomization, McpServerErrorState } from '@microsoft/agent-host-protocol';
import { translate } from '@softov/scena';

/** What an MCP server's open row shows: what the host sent about it, in a person's words. */
export interface McpFacts {
  /** The state in full: the host's message for an error or a sign-in, else the state's word. */
  state: string;
  /** The error's type, such as `mcpAuthRequired`, when the host sent one. */
  errorType?: string;
  /** Where the server is declared: the file's short path, or the Claude CLI when no file this host reads declares it. */
  declared: string;
  /** Whether a new session starts with the server on. */
  onInSession: boolean;
  /** The server's id, which the row copies. */
  id: string;
}

/** The uri scheme agent-claude gives a server that no file it reads declares, such as a claude.ai connector or one from another scope. */
const INTERNAL = 'claude-internal:';

/** The facts of one MCP server; `shortPath` names a file the way the rows do. */
export function mcpFacts(server: McpServerCustomization, shortPath: (uri: string) => string): McpFacts {
  const state = server.state;
  const kind = String(state.kind);
  const error = kind === 'error' ? (state as McpServerErrorState).error : undefined;
  const auth = kind === 'authRequired' ? (state as McpServerAuthRequiredState) : undefined;
  const words: Record<string, string> = {
    ready: translate('agents/states/ready'),
    starting: translate('agents/states/starting'),
    stopped: translate('agents/states/stopped'),
    authRequired: translate('agents/auth/required'),
  };
  return {
    state: error?.message ?? auth?.description ?? words[kind] ?? kind,
    ...(error?.errorType === undefined ? {} : { errorType: String(error.errorType) }),
    declared: server.uri.startsWith(INTERNAL) ? translate('agents/mcp/claudeCli') : shortPath(server.uri),
    onInSession: server.enablement?.[0]?.enabled ?? true,
    id: server.id,
  };
}
