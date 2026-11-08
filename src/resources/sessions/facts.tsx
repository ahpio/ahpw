import type { ReactElement } from 'react';
import type { ChatState, SessionState, SessionSummary, TerminalState } from '@microsoft/agent-host-protocol';
import { useI18n, useScena } from '@softov/scena/react';
import type { DetailItem } from '@softov/scena/ui';
import type { Scena } from '@softov/scena/types';
import type { HostFacts } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed, folderLabel } from '../../bridges/words.js';
import { plural } from '../../i18n/locales.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { foldTerminal, inFolder } from '../terminals/terminal.js';
import { tokens, totalsOf, when } from './turn.js';
import './facts.css';

/** A terminal, as a link that opens it, while its directory is in the session's folder. */
function FolderTerminal({ host, uri, folder }: { host: string; uri: string; folder: string }): ReactElement | null {
  const scena = useScena();
  const { t } = useI18n();
  const { state } = useChannel<TerminalState>(host, uri, foldTerminal);
  if (!inFolder(state?.cwd, folder)) return null;
  return (
    <button type="button" className="web-link" title={t('sessions/details/openTerminal')} onClick={() => void scena.commands.execute('ahp.openTerminal', { uri })}>
      {state?.title === '' || state?.title === undefined ? t('sessions/details/terminal') : state.title}
    </button>
  );
}

/** An id as code, with a button that copies it. */
function CopiedId({ id }: { id: string }): ReactElement {
  return (
    <span className="web-details__id">
      <code>{id}</code>
      <CopyButton text={id} />
    </span>
  );
}

/** What the facts of a session are read from. */
export interface FactsOf {
  host: string;
  summary: SessionSummary;
  session: SessionState | undefined;
  chat: ChatState | undefined;
  /** The chat the facts name; the session's default chat when absent. */
  chatUri: string | undefined;
  hostFacts: HostFacts | null | undefined;
  /** Whether the session's title is a fact: the session header already shows it. */
  title: boolean;
  /** Whether turns, working time, tokens and tool calls are facts: the header's KPIs already show them. */
  figures: boolean;
}

/**
 * A session's facts, in the order they are read: the host when there are
 * several, what runs it, its ids, where it works, when, what it did, and who
 * watches it.
 */
export function sessionFacts(scena: Scena, t: (key: string, values?: Record<string, unknown>) => string, of: FactsOf): DetailItem[] {
  const { host, summary, session, chat, hostFacts } = of;
  const totals = totalsOf(chat?.turns ?? []);
  const folder = summary.workingDirectories?.[0];
  const changes = summary.changes;
  const origin = summary.origin;
  const watching = session?.activeClients.length ?? 0;
  const chatUri = of.chatUri ?? session?.defaultChat ?? summary.defaultChat;
  const facts: DetailItem[] = [];
  // With every host, the host first: the rest is that host's.
  if (embedMode() === 'multi') facts.push({ label: t('common/host'), value: <HostTag host={host} />, span: true });
  if (of.title) facts.push({ label: t('sessions/details/session'), value: summary.title === '' ? t('sessions/untitled') : summary.title, span: true });
  facts.push({ label: t('sessions/details/agent'), value: summary.provider });
  if (totals.models.length > 0) facts.push({ label: t('sessions/details/model'), value: totals.models.join(', ') });
  facts.push({ label: t('sessions/details/sessionId'), value: <CopiedId id={summary.resource} />, span: true });
  if (chatUri !== undefined) facts.push({ label: t('sessions/details/chatId'), value: <CopiedId id={chatUri} />, span: true });
  if (folder !== undefined) {
    facts.push({
      label: t('sessions/details/folder'),
      value: (
        <button type="button" className="web-link" title={t('sessions/details/revealFolder')} onClick={() => void scena.commands.execute('ahp.revealFolder', { host, uri: folder })}>
          <code>{folderLabel(folder)}</code>
        </button>
      ),
    });
  }
  facts.push({
    label: t('sessions/details/terminal'),
    value: (
      <span className="web-details__list">
        {folder === undefined ? null : (hostFacts?.terminals ?? []).map((terminal) => <FolderTerminal key={terminal.resource} host={host} uri={terminal.resource} folder={folder} />)}
        <button type="button" className="web-link" title={folder === undefined ? t('sessions/details/newTerminalHint') : t('sessions/details/newTerminalInFolder')} onClick={() => void scena.commands.execute('ahp.newTerminal', { host, ...(folder === undefined ? {} : { cwd: folder }) })}>
          {t('sessions/details/newTerminal')}
        </button>
      </span>
    ),
  });
  if (summary.project !== undefined) facts.push({ label: t('sessions/details/project'), value: summary.project.displayName });
  facts.push({ label: t('sessions/details/started'), value: when(summary.createdAt) }, { label: t('sessions/details/changed'), value: when(summary.modifiedAt) });
  if (of.figures && totals.turns > 0) {
    const cached = (chat?.turns ?? []).reduce((sum, turn) => sum + (turn.usage?.cacheReadTokens ?? 0), 0);
    facts.push({ label: t('sessions/details/turns'), value: `${totals.turns}${chat?.turnsNextCursor === undefined ? '' : '+'}` });
    facts.push({ label: t('sessions/details/working'), value: elapsed(totals.working) });
    facts.push({
      label: t('sessions/details/tokens'),
      value: `\u{2191}${tokens(totals.input)} \u{2193}${tokens(totals.output)}${cached === 0 ? '' : ` \u{00B7} ${t('sessions/details/cached', { count: tokens(cached) })}`}`,
    });
    if (totals.tools > 0) facts.push({ label: t('sessions/details/toolCalls'), value: String(totals.tools) });
  }
  if (changes !== undefined && (changes.additions !== undefined || changes.deletions !== undefined)) {
    facts.push({
      label: t('sessions/details/changes'),
      value: (
        <span>
          <span className="web-diff--add">+{changes.additions ?? 0}</span>{' '}
          <span className="web-diff--remove">-{changes.deletions ?? 0}</span>
          {changes.files === undefined ? '' : ` ${plural('sessions/details/inFiles', changes.files)}`}
        </span>
      ),
    });
  }
  if (origin !== undefined && String(origin.kind) === 'automation') facts.push({ label: t('sessions/details/from'), value: t('sessions/details/automation') });
  if (watching > 0) facts.push({ label: t('sessions/details/watching'), value: String(watching) });
  return facts;
}
