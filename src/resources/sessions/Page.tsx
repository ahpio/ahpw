import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, Spinner, Text } from '@softov/scena/ui';
import {
  chatReducer,
  sessionReducer,
  type ActiveTurn,
  type ChatInputRequest,
  type ChatState,
  type MessageAttachment,
  type SessionState,
  type SessionSummary,
  type StateAction,
  type Turn,
} from '@microsoft/agent-host-protocol';
import { ahpPaths, hostBridge } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed } from '../../bridges/words.js';
import { Part, type Send } from './Parts.js';
import { RawView } from './RawView.js';
import { sessionOfChannel } from '../log/wire.js';
import { subagentCalls } from './header.js';
import { rawOf, type RawFilter } from './raw.js';
import { SessionHeaderTools } from './SessionHeader.js';
import { answeredHere, InputRequest } from './Question.js';
import { Activity } from './Activity.js';
import { groupParts, stepWaits } from './activity-parts.js';
import { Composer } from './Composer.js';
import { HeaderLine, SessionInfo } from './HeaderInfo.js';
import { SessionHostContext, WorkspaceContext } from './workspace.js';
import { ACTIVITY_TONE, activityLabel, activityOf, isRead } from './status.js';
import { plural } from '../../i18n/locales.js';
import { factsOf, replyText, tokens, when, type TurnFacts } from './turn.js';
import { attachmentIcon, attachmentLabel, hasPreview, previewOf, type AttachmentPreviewOf } from './attachments.js';
import { AttachmentPreview } from './Attached.js';
import { EMOJIcon } from '../emojis.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { BotChat } from '../bots/chat/BotChat.js';
import { sessionKey } from './focus.js';
import { botMarkOf } from '../bots/chat/mark.js';
import { askOf, opens, type Origins, type Source } from './origin.js';
import { useNow } from './clock.js';
import { sessionUsage } from '../../bridges/usage-meta.js';
import { hasUsage, UsageDialog } from './Usage.js';

/** How a turn ended, as the key of its words, when it did not end well. */
const ENDED: Record<string, string> = { cancelled: 'sessions/turn/stopped', error: 'sessions/turn/failed' };

/** The line under a turn: a copy of its reply, when, how long, the tokens, the model and the tools it called. */
function FactLine({ facts, state, live, text }: { facts: TurnFacts; state?: string; live: boolean; text: string }): ReactElement {
  const { t } = useI18n();
  const now = useNow(live);
  const took = live ? (facts.startedAt === undefined ? undefined : now - facts.startedAt) : facts.duration;
  const bits: string[] = [];
  if (facts.startedAt !== undefined) bits.push(when(facts.startedAt));
  if (took !== undefined) bits.push(live ? t('sessions/turn/soFar', { time: elapsed(took) }) : elapsed(took));
  if (facts.input !== undefined || facts.output !== undefined) bits.push(`\u{2191}${tokens(facts.input ?? 0)} \u{2193}${tokens(facts.output ?? 0)}`);
  if (facts.cacheRead !== undefined && facts.cacheRead > 0) bits.push(t('sessions/turn/cached', { tokens: tokens(facts.cacheRead) }));
  if (facts.model !== undefined) bits.push(facts.model);
  if (facts.tools > 0) bits.push(plural('sessions/turn/toolCalls', facts.tools));
  const ended = state === undefined ? undefined : ENDED[state];
  return (
    <div className="web-turn__facts">
      {live || text === '' ? null : <CopyButton text={text} label={t('sessions/turn/copyReply')} />}
      {bits.join(' \u{00B7} ')}
      {ended === undefined ? null : <span className="web-turn__ended" data-state={state}>{t(ended)}</span>}
    </div>
  );
}

const NONE: readonly ChatInputRequest[] = [];

/** A message the host started: one muted line, which opens the full text when it holds more. */
function Notice({ line, text }: { line: string; text: string }): ReactElement {
  const [open, setOpen] = useState(false);
  const more = text.trim() !== line;
  const body = <><span aria-hidden="true">{EMOJIcon.info}</span><span>{line}</span></>;
  return (
    <div className="web-turn__notice">
      {more ? (
        <button type="button" className="web-activity__line" aria-expanded={open} onClick={() => setOpen(!open)}>
          {body}
          <span className="web-activity__chev" aria-hidden="true">{open ? EMOJIcon.caretDown : EMOJIcon.caretRight}</span>
        </button>
      ) : <span className="web-turn__notice-line">{body}</span>}
      {open ? <div className="web-turn__notice-text">{text}</div> : null}
    </div>
  );
}

/** The words of a source's chip, and the hint of its click. */
const FROM_WORDS: Record<Source['scope'], { label: string; open: string }> = {
  chat: { label: 'sessions/turn/fromChat', open: 'sessions/turn/openSource' },
  session: { label: 'sessions/turn/fromSession', open: 'sessions/turn/openSource' },
  agent: { label: 'sessions/turn/fromAgent', open: 'sessions/turn/openParent' },
  automation: { label: 'sessions/turn/fromAutomation', open: 'sessions/turn/openAutomation' },
};

/** The chip over a message the person did not type, which names its sender and opens it when the host named where. */
function FromChip({ from, onSource }: { from: Source; onSource: (from: Source) => void }): ReactElement {
  const { t } = useI18n();
  const words = FROM_WORDS[from.scope];
  const body = <><span aria-hidden="true">{EMOJIcon.forward}</span>{t(words.label)}</>;
  return opens(from)
    ? <button type="button" className="web-chip web-turn__from" title={t(words.open)} onClick={() => onSource(from)}>{body}</button>
    : <span className="web-chip web-turn__from">{body}</span>;
}

/** What a message carried along with its text: a file opens where it is one, what the message holds opens a preview. */
function SentAttachments({ attachments }: { attachments: readonly MessageAttachment[] }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [preview, setPreview] = useState<AttachmentPreviewOf | null>(null);
  return (
    <div className="web-turn__attached">
      {attachments.map((attachment, index) => {
        const held = attachment as { uri?: unknown; displayKind?: unknown };
        const uri = typeof held.uri === 'string' && held.displayKind !== 'directory' ? held.uri : undefined;
        const label = attachmentLabel(attachment);
        const body = <><span className="web-attachment__icon">{attachmentIcon(attachment)}</span><span className="web-attachment__label">{label}</span></>;
        if (hasPreview(attachment)) return <button key={index} type="button" className="web-attachment" title={t('sessions/attachments/see', { name: label })} onClick={() => setPreview(previewOf(attachment))}>{body}</button>;
        return uri === undefined
          ? <span key={index} className="web-attachment" title={label}>{body}</span>
          : <button key={index} type="button" className="web-attachment" title={t('sessions/attachments/open', { name: label })} onClick={() => void scena.commands.execute('ahp.openFile', { uri })}>{body}</button>;
      })}
      {preview === null ? null : <AttachmentPreview preview={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/** A finished turn renders once: the reducer keeps its object while later turns stream. */
const TurnView = memo(function TurnView({ turn, live, send, session, origins, onSource, open = NONE, hideCalls = false }: {
  turn: Turn | ActiveTurn;
  live: boolean;
  send: Send;
  /** The URI of the session that holds the turn. */
  session: string | undefined;
  /** The origins of the turn's chat and session, which name an automation or a parent agent. */
  origins: Origins;
  /** Opens the chat or session that sent a message. */
  onSource: (from: Source) => void;
  /** Leaves out the runs of calls and thinking, except one in a running turn that waits on the person. */
  hideCalls?: boolean;
  /** Questions the session waits on that no part of this turn holds: what a page opened mid-question reads. */
  open?: readonly ChatInputRequest[];
}): ReactElement {
  const { t } = useI18n();
  const state = 'state' in turn ? String(turn.state) : undefined;
  const parts = turn.responseParts;
  const ask = askOf(turn.message, session, origins);
  const attachments = turn.message.attachments === undefined || turn.message.attachments.length === 0 ? null : <SentAttachments attachments={turn.message.attachments} />;
  return (
    <article className="web-turn">
      {ask.kind === 'hidden' ? null : ask.kind === 'notice' ? (
        <>
          <Notice line={ask.line} text={turn.message.text} />
          {attachments}
        </>
      ) : (
        <>
          {ask.from === undefined ? null : <FromChip from={ask.from} onSource={onSource} />}
          <div className="web-turn__ask">
            {turn.message.text}
            {attachments}
          </div>
        </>
      )}
      <div className="web-turn__answer">
        {groupParts(parts, live, factsOf(turn).duration).map((shown) => shown.kind === 'activity'
          ? (hideCalls && (shown.ended || !shown.steps.some(stepWaits)) ? null : <Activity key={shown.id} group={shown} send={send} turnId={turn.id} />)
          : <Part key={shown.index} part={shown.part} send={send} live={live} turnId={turn.id} />)}
        {live ? open.map((request) => <InputRequest key={request.id} request={request} send={send} live response={undefined} />) : null}
        {live && parts.length === 0 ? <Spinner label={t('sessions/turn/working')} /> : null}
      </div>
      <FactLine facts={factsOf(turn)} {...(state === undefined ? {} : { state })} live={live} text={replyText(turn)} />
    </article>
  );
});

/** Asks the host for the page of turns before the oldest one shown. */
function OlderTurns({ host, chatUri, cursor }: { host: string; chatUri: string; cursor: string }): ReactElement {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = (): void => {
    setBusy(true);
    setError(null);
    hostBridge(host).request('fetchTurns', { channel: chatUri, cursor })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : String(caught)))
      .finally(() => setBusy(false));
  };
  return (
    <div className="web-chat__older">
      <Button label={busy ? t('sessions/chat/loading') : t('sessions/chat/older')} disabled={busy} onClick={load} />
      {error === null ? null : <span className="web-note">{error}</span>}
    </div>
  );
}

/**
 * The questions this chat waits on that its running turn does not hold as a
 * part. A page opened mid-question finds them only in the session's
 * `inputNeeded`. One this window answered stays listed after the host drops
 * it, until the turn ends, so the answer sent stays on screen; one answered
 * elsewhere, as in a bot's chat, goes when the host drops it.
 */
function useOpenQuestions(host: string, needed: SessionState['inputNeeded'], chatUri: string | undefined, active: ActiveTurn | undefined): readonly ChatInputRequest[] {
  const kept = useRef<{ turn: string | undefined; requests: Map<string, ChatInputRequest> }>({ turn: undefined, requests: new Map() });
  if (kept.current.turn !== active?.id) kept.current = { turn: active?.id, requests: new Map() };
  if (active === undefined) return NONE;
  const waiting = new Set<string>();
  for (const entry of needed ?? []) {
    if (String(entry.kind) !== 'chatInput' || entry.chat !== chatUri || !('request' in entry)) continue;
    kept.current.requests.set(entry.id, entry.request);
    waiting.add(entry.id);
  }
  for (const id of [...kept.current.requests.keys()]) {
    if (!waiting.has(id) && !answeredHere(host, id)) kept.current.requests.delete(id);
  }
  const held = new Set(active.responseParts.flatMap((part) => ('request' in part ? [part.request.id] : [])));
  const out = [...kept.current.requests.values()].filter((request) => !held.has(request.id));
  return out.length === 0 ? NONE : out;
}

/**
 * One session: what it is, its chat, and a composer to talk to it. A pointer
 * down anywhere in it gives its tab the focus in
 * `main`, so the right sidebar follows the session a person works in. With
 * `beside`, the page is drawn in the right sidebar, beside that session, and
 * leaves the session's unread mark alone.
 */
export default function SessionPage({ host, resource, beside = false }: { host: string; resource?: string; beside?: boolean }): ReactElement {
  const scena = useScena();
  const focus = (): void => {
    if (resource === undefined) return;
    const key = sessionKey(host, resource);
    const main = scena.layout.get().surfaces.main;
    if (main?.activeContainerKey === key) return;
    // Only the page's own tab in `main`; the same session drawn elsewhere leaves the focus where it is.
    if (!scena.surfaces.listAt('main').some((mount) => mount.key === key)) return;
    scena.layout.setSurface('main', { ...main, visible: main?.visible ?? true, activeContainerKey: key });
  };
  return (
    <div className="web-session-page" onPointerDownCapture={focus}>
      <SessionView host={host} beside={beside} {...(resource === undefined ? {} : { resource })} />
    </div>
  );
}

function SessionView({ host, resource, beside }: { host: string; resource?: string; beside: boolean }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const sessions = useStore<SessionSummary[]>(ahpPaths(host).sessions);
  const summary = sessions?.find((one) => one.resource === resource);
  const session = useChannel<SessionState>(host, resource, sessionReducer);
  // The chat the page shows: the one picked in the header while the session still has it, else the default.
  const [picked, setPicked] = useState<string | undefined>(undefined);
  const chosen = picked !== undefined && (session.state?.chats ?? []).some((one) => one.resource === picked) ? picked : undefined;
  const chatUri = chosen ?? session.state?.defaultChat ?? summary?.defaultChat;
  // The Raw view, and which steps it keeps; the page opens on the chat.
  const [raw, setRaw] = useState(false);
  const [rawFilter, setRawFilter] = useState<RawFilter>('all');
  const [callsHidden, setCallsHidden] = useState(false);
  // The Usage view, opened from the composer's readout or the header's menu.
  const [usageOpen, setUsageOpen] = useState(false);
  const chat = useChannel<ChatState>(host, chatUri, chatReducer);
  const end = useRef<HTMLDivElement>(null);
  // Following the newest turn, until a person scrolls up to read an older one.
  const following = useRef(true);
  // The session's info, shown in place of the chat, and where the chat was scrolled when it opened.
  const [infoOpen, setInfoOpen] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const chatScroll = useRef(0);
  const toggleInfo = useCallback((next: boolean): void => {
    const box = scroller.current;
    if (next) chatScroll.current = box?.scrollTop ?? 0;
    setInfoOpen(next);
    // After the swap is drawn: the info opens at its top, and the chat comes back where it was, or at its end when following.
    requestAnimationFrame(() => {
      if (box === null) return;
      if (next) box.scrollTop = 0;
      else if (following.current) end.current?.scrollIntoView({ block: 'end' });
      else box.scrollTop = chatScroll.current;
    });
  }, []);
  const send = useCallback<Send>((action) => {
    if (chatUri !== undefined) hostBridge(host).dispatch(chatUri, action);
  }, [chatUri]);
  // Read when a chip is clicked, so the callback keeps one identity and a finished turn does not draw again.
  const chats = useRef(session.state?.chats);
  chats.current = session.state?.chats;
  const openSource = useCallback((from: Source): void => {
    if (from.scope === 'automation') {
      if (from.automation !== undefined) void scena.commands.execute('ahp.openAutomation', { host, resource: from.automation });
      return;
    }
    if (from.chat !== undefined && (chats.current ?? []).some((one) => one.resource === from.chat)) {
      setPicked(from.chat);
      return;
    }
    if (from.scope !== 'agent') void scena.commands.execute('ahp.openSession', { host, resource: from.session });
  }, [host, scena]);
  const chatOrigin = session.state?.chats.find((one) => one.resource === chatUri)?.origin;
  const sessionOrigin = summary?.origin;
  const origins = useMemo<Origins>(() => ({ chat: chatOrigin, session: sessionOrigin }), [chatOrigin, sessionOrigin]);
  const sessionMeta = session.state?._meta;
  const turnMeta = chat.state?.turns.at(-1)?.usage?._meta;
  const usage = useMemo(() => sessionUsage(sessionMeta, turnMeta), [sessionMeta, turnMeta]);

  const turns = chat.state?.turns.length ?? 0;
  const open = useOpenQuestions(host, session.state?.inputNeeded, chatUri, chat.state?.activeTurn);
  // Grows with every delta, so the view follows text as it streams, not only new parts.
  const streamed = (chat.state?.activeTurn?.responseParts ?? []).reduce((total, part) => total + 1 + ('content' in part && typeof part.content === 'string' ? part.content.length : 0), 0);
  useEffect(() => {
    if (following.current && !infoOpen) end.current?.scrollIntoView({ block: 'end' });
  }, [turns, streamed, infoOpen]);

  // Opening a session is reading it, as far as the unread dot is concerned.
  const unread = !beside && summary !== undefined && !isRead(summary.status);
  useEffect(() => {
    if (unread && resource !== undefined) hostBridge(host).dispatch(resource, { type: 'session/isReadChanged', isRead: true } as StateAction);
  }, [unread, resource, turns]);

  if (summary === undefined) return <PageAlert tone="warning" message={t('sessions/chat/gone')} />;
  // A subagent's chat opens here when it is this session's; another session's, as a bot's back session, opens that session.
  const openSubagent = (uri: string): void => {
    if ((session.state?.chats ?? []).some((one) => one.resource === uri)) {
      setPicked(uri);
      return;
    }
    const other = sessionOfChannel(uri);
    if (other !== null) void scena.commands.execute('ahp.openSession', { host, resource: other });
  };
  // A session with a bot's mark is a chat with that bot, whatever its provider: only what is said shows.
  const mark = botMarkOf(summary._meta) ?? botMarkOf(session.state?._meta);
  const openUsage = hasUsage(usage) ? () => setUsageOpen(true) : undefined;
  // The header's buttons and the Raw view, the same on a session and on a chat with a bot, whose bubbles draw no calls to hide.
  const tools = (
    <SessionHeaderTools
      host={host}
      summary={summary}
      session={session.state}
      chat={chat.state}
      chatUri={chatUri}
      onChat={setPicked}
      onSubagent={openSubagent}
      raw={raw}
      onRaw={setRaw}
      {...(openUsage === undefined ? {} : { onUsage: openUsage })}
      {...(mark === undefined ? { calls: { hidden: callsHidden, onHidden: setCallsHidden } } : { bot: mark })}
    />
  );
  // Drawn inside the page's session host and folder, which both pages provide.
  const rawView = raw && chat.state !== undefined ? (
    <RawView
      turns={rawOf(chat.state.turns, chat.state.activeTurn)}
      filter={rawFilter}
      onFilter={setRawFilter}
      spawned={subagentCalls(chat.state.turns, chat.state.activeTurn, session.state?.chats ?? [], chatUri)}
      onOpenChat={openSubagent}
    />
  ) : null;
  if (mark !== undefined) {
    // A bot's bubble draws a question or an approval as a transcript part, which reads the session's host and folder.
    return (
      <SessionHostContext.Provider value={host}>
        <WorkspaceContext.Provider value={summary.workingDirectories?.[0] ?? null}>
          <BotChat host={host} mark={mark} summary={summary} session={session} chat={chat} chatUri={chatUri} send={send} tools={tools} rawView={rawView} />
        </WorkspaceContext.Provider>
      </SessionHostContext.Provider>
    );
  }
  const activity = activityOf(summary.status);
  const lifecycle = String(session.state?.lifecycle ?? 'ready');
  const doing = chat.state?.activity ?? summary.activity;

  return (
    <div className="web-chat">
      <div
        ref={scroller}
        className="web-chat__turns"
        onScroll={(event) => {
          // Scrolling the info says nothing of where the chat is read.
          if (infoOpen) return;
          const box = event.currentTarget;
          following.current = box.scrollHeight - box.scrollTop - box.clientHeight < 48;
        }}
      >
        {/* Inside the scroll, so the turns pass under its faded bottom edge. */}
        <header className="web-chat__head">
          <div className="web-chat__head-row">
            <div className="web-chat__title">
              <Text variant="h2" text={summary.title === '' ? t('sessions/untitled') : summary.title} />
              <Badge tone={ACTIVITY_TONE[activity]} text={activityLabel(activity)} />
            </div>
            {tools}
          </div>
          <HeaderLine summary={summary} chat={chat.state} open={infoOpen} onToggle={() => toggleInfo(!infoOpen)} />
          {doing === undefined || doing === '' ? null : <span className="web-note web-chat__doing">{doing}</span>}
        </header>
        {lifecycle === 'creating' ? <Spinner label={t('sessions/chat/starting')} /> : null}
        {lifecycle === 'failed' ? <Alert tone="danger" title={t('sessions/chat/notStarted')} message={session.state?.creationError?.message ?? t('sessions/chat/noReason')} /> : null}
        {session.error === null ? null : <Alert tone="danger" title={t('sessions/chat/sessionUnreadable')} message={session.error} />}
        {chat.error === null ? null : <Alert tone="danger" title={t('sessions/chat/chatUnreadable')} message={chat.error} />}
        {chatUri !== undefined && chat.state === undefined && chat.error === null ? <Spinner label={t('sessions/chat/reading')} /> : null}
        {infoOpen ? <SessionInfo host={host} summary={summary} session={session.state} chat={chat.state} chatUri={chatUri} /> : (
          <>
            {chatUri === undefined || chat.state?.turnsNextCursor === undefined ? null : <OlderTurns host={host} chatUri={chatUri} cursor={chat.state.turnsNextCursor} />}
            <SessionHostContext.Provider value={host}>
              <WorkspaceContext.Provider value={summary.workingDirectories?.[0] ?? null}>
                {rawView ?? (
                  <>
                    {chat.state?.turns.map((turn) => <TurnView key={turn.id} turn={turn} live={false} send={send} session={resource} origins={origins} onSource={openSource} hideCalls={callsHidden} />)}
                    {chat.state?.activeTurn === undefined ? null : <TurnView turn={chat.state.activeTurn} live send={send} session={resource} origins={origins} onSource={openSource} open={open} hideCalls={callsHidden} />}
                  </>
                )}
              </WorkspaceContext.Provider>
            </SessionHostContext.Provider>
            {chat.state !== undefined && turns === 0 && chat.state.activeTurn === undefined ? <p className="web-note">{t('sessions/chat/empty')}</p> : null}
          </>
        )}
        <div ref={end} />
      </div>

      {chat.state === undefined || chatUri === undefined ? null : (
        <Composer
          host={host}
          chatUri={chatUri}
          activeId={chat.state.activeTurn?.id}
          activeStart={chat.state.activeTurn?.startedAt}
          queued={chat.state.queuedMessages}
          steering={chat.state.steeringMessage}
          draft={chat.state.draft}
          lastModel={chat.state.turns.at(-1)?.message.model?.id}
          lastUsage={chat.state.turns.at(-1)?.usage}
          usage={usage}
          {...(openUsage === undefined ? {} : { onUsage: openUsage })}
          config={session.state?.config}
          customizations={session.state?.customizations}
          changesets={session.state?.changesets}
          backgroundWork={chat.state.backgroundWork}
          summary={summary}
          send={send}
          {...(infoOpen ? { onEngage: () => toggleInfo(false) } : {})}
        />
      )}
      {usageOpen ? <UsageDialog usage={usage} onClose={() => setUsageOpen(false)} /> : null}
    </div>
  );
}
