import { sessionReducer, type SessionState, type SessionSummary } from '@microsoft/agent-host-protocol';
import { useStore } from '@softov/scena/react';
import { hostBridge, summaryPath } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { ACTIVE_SESSION, type ActiveSession } from './state.js';

/** The focused session as a view beside it reads it. */
export interface ActiveFacts {
  host: string;
  summary: SessionSummary | undefined;
  session: SessionState | undefined;
  /** The client id this window has on the session's host. */
  own: string | undefined;
}

/** The focused session, followed while the view is open. */
export function useActiveSession(): ActiveFacts {
  const active = useStore<ActiveSession>(ACTIVE_SESSION);
  const host = active?.host ?? '';
  const resource = active?.resource;
  const summary = useStore<SessionSummary>(resource === undefined ? undefined : summaryPath(host, resource));
  const session = useChannel<SessionState>(host, summary === undefined ? undefined : resource, sessionReducer);
  return { host, summary, session: session.state, own: host === '' ? undefined : hostBridge(host).clientId() };
}
