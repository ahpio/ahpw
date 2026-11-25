import type { SessionState, StateAction } from '@microsoft/agent-host-protocol';
import { TOOLS } from './tools.js';

/**
 * What to say to a session so it lists this browser's tools while one command
 * or more is on: the tools, a removal when it still lists them and none is,
 * or nothing.
 */
export function announcement(own: string, on: boolean, session: SessionState): StateAction | undefined {
  if (on) return { type: 'session/activeClientSet', activeClient: { clientId: own, displayName: 'ahpw', tools: TOOLS } } as StateAction;
  if (!session.activeClients.some((one) => one.clientId === own)) return undefined;
  return { type: 'session/activeClientRemoved', clientId: own } as StateAction;
}
