import { useMemo, type ReactElement } from 'react';
import type { ChatState, SessionState, SessionSummary } from '@microsoft/agent-host-protocol';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { DetailList } from '@softov/scena/ui';
import { ahpPaths, type HostFacts } from '../../bridges/data.js';
import { elapsed } from '../../bridges/words.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { sessionFacts } from './facts.js';
import { figuresOf } from './figures.js';
import { Summary } from './Summary.js';
import { tokens, when } from './turn.js';
import './header-info.css';

/**
 * The line under a session's title: its turns, working time, tokens and when
 * it started. A click shows the session's info in place of its chat, and a
 * second click brings the chat back.
 */
export function HeaderLine({ summary, chat, open, onToggle }: { summary: SessionSummary; chat: ChatState | undefined; open: boolean; onToggle: () => void }): ReactElement {
  const { t } = useI18n();
  const turns = chat?.turns;
  const active = chat?.activeTurn;
  const figures = useMemo(() => figuresOf(turns ?? [], active), [turns, active]);
  const more = chat?.turnsNextCursor !== undefined;
  return (
    <button type="button" className="web-head-info__line" aria-expanded={open} title={t(open ? 'sessions/info/hide' : 'sessions/info/show')} onClick={onToggle}>
      <span className="web-head-info__caret" aria-hidden="true">{open ? EMOJIcon.caretDown : EMOJIcon.caretRight}</span>
      <span>{`${plural('sessions/info/turnCount', figures.turns)}${more ? '+' : ''}`}</span>
      <span>{t('sessions/info/workingFor', { time: elapsed(figures.working) })}</span>
      <span>{t('sessions/info/tokenCount', { count: tokens(figures.input + figures.output + figures.cached) })}</span>
      <span>{when(summary.createdAt)}</span>
    </button>
  );
}

/** A session's info, drawn in place of its chat: its facts, then its Summary. */
export function SessionInfo({ host, summary, session, chat, chatUri }: { host: string; summary: SessionSummary; session: SessionState | undefined; chat: ChatState | undefined; chatUri: string | undefined }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const hostFacts = useStore<HostFacts | null>(ahpPaths(host).host);
  const turns = chat?.turns;
  const active = chat?.activeTurn;
  const figures = useMemo(() => figuresOf(turns ?? [], active), [turns, active]);
  return (
    <div className="web-head-info__panel">
      <DetailList items={sessionFacts(scena, t, { host, summary, session, chat, chatUri, hostFacts, title: false, figures: false })} columns={2} />
      <Summary figures={figures} summary={summary} session={session} />
    </div>
  );
}
