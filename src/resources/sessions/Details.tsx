import type { ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { chatReducer, sessionReducer, type ChatState, type SessionState, type SessionSummary } from '@microsoft/agent-host-protocol';
import { ahpPaths, summaryPath, type HostFacts } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { ACTIVE_SESSION, type ActiveSession } from './state.js';
import { sessionFacts } from './facts.js';
import { DetailList, Note, Panel } from '../../ui/index.js';

/** The open session's facts, for the right sidebar. */
export default function SessionDetails(): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const active = useStore<ActiveSession>(ACTIVE_SESSION);
  const at = active?.host ?? '';
  const resource = active?.resource;
  const hostFacts = useStore<HostFacts | null>(ahpPaths(at).host);
  const summary = useStore<SessionSummary>(resource === undefined ? undefined : summaryPath(at, resource));
  const session = useChannel<SessionState>(at, summary === undefined ? undefined : resource, sessionReducer);
  const chat = useChannel<ChatState>(at, session.state?.defaultChat ?? summary?.defaultChat, chatReducer);
  if (summary === undefined) return <Note inset>{t('sessions/details/empty')}</Note>;
  const facts = sessionFacts(scena, t, { host: at, summary, session: session.state, chat: chat.state, chatUri: undefined, hostFacts, title: true, figures: true });
  return (
    <Panel padded>
      <DetailList inline items={facts.map((fact) => ({ label: fact.label, value: fact.value }))} />
    </Panel>
  );
}
