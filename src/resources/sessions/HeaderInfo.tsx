import { useMemo, useState, type ReactElement } from 'react';
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
 * it started. A click opens the session's facts and its Summary below it, and
 * a second click folds them again.
 */
export function HeaderInfo({ host, summary, session, chat, chatUri }: { host: string; summary: SessionSummary; session: SessionState | undefined; chat: ChatState | undefined; chatUri: string | undefined }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const hostFacts = useStore<HostFacts | null>(ahpPaths(host).host);
  const turns = chat?.turns;
  const active = chat?.activeTurn;
  const figures = useMemo(() => figuresOf(turns ?? [], active), [turns, active]);
  const more = chat?.turnsNextCursor !== undefined;
  return (
    <div className="web-head-info">
      <button type="button" className="web-head-info__line" aria-expanded={open} title={t(open ? 'sessions/info/hide' : 'sessions/info/show')} onClick={() => setOpen((was) => !was)}>
        <span className="web-head-info__caret" aria-hidden="true">{open ? EMOJIcon.caretDown : EMOJIcon.caretRight}</span>
        <span>{`${plural('sessions/info/turnCount', figures.turns)}${more ? '+' : ''}`}</span>
        <span>{t('sessions/info/workingFor', { time: elapsed(figures.working) })}</span>
        <span>{t('sessions/info/tokenCount', { count: tokens(figures.input + figures.output + figures.cached) })}</span>
        <span>{when(summary.createdAt)}</span>
      </button>
      {open ? (
        <div className="web-head-info__panel">
          <DetailList items={sessionFacts(scena, t, { host, summary, session, chat, chatUri, hostFacts, title: false, figures: false })} columns={2} />
          <Summary figures={figures} summary={summary} session={session} />
        </div>
      ) : null}
    </div>
  );
}
