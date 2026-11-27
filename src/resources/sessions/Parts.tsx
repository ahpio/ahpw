import { memo, useContext, useState, type MouseEvent, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, DetailList, Note, Pill, Row, RowButton } from '../../ui/index.js';
import { Markdown } from '../../shell/markdown/Markdown.js';
import type {
  ResponsePart,
  StateAction,
  ToolCallState,
} from '@microsoft/agent-host-protocol';
import { elapsed, folderLabel, textOf } from '../../bridges/words.js';
import { codePath, fileLink } from '../files/link.js';
import { linkClicks } from '../files/clicks.js';
import { useChatUri, useSessionHost, WorkspaceContext } from './workspace.js';
import { hostBridge } from '../../bridges/data.js';
import { failed } from '../../shell/notify/index.js';
import { CopyButton } from '../../ui/control/CopyButton.js';
import { useAsks } from '../agent-tools/asks.js';
import { ClientAsk } from './ClientAsk.js';
import { Confirm } from './Confirm.js';
import { InputRequest } from './Question.js';
import { durationOf, fileOf, inputText, kindOf, lineOf, MOVE_CALL, movableOf, outcomeOf, outputOf, segmentsOf, type Outcome, type Output, type ToolKind } from './tool.js';
import { EMOJIcon } from '../emojis.js';
import { SESSION_MARKDOWN, TOOLS_EXPANDED } from './view-settings.js';
import './parts.css';
import '../files/diff-page.css';
import '../../shell/markdown/markdown.css';

/** Sends one action on the chat this transcript shows. */
export type Send = (action: StateAction) => void;

/** Tool call statuses, as their wire values: the enum is ambient and `const`. */
const PENDING_CONFIRMATION = 'pending-confirmation';
const PENDING_RESULT_CONFIRMATION = 'pending-result-confirmation';

/** The mark a call carries collapsed, and the key of the word behind it. */
export const MARK: Record<Outcome, { glyph: string; label: string }> = {
  preparing: { glyph: EMOJIcon.pending, label: 'sessions/tool/preparing' },
  approval: { glyph: EMOJIcon.waiting, label: 'sessions/tool/approval' },
  running: { glyph: EMOJIcon.running, label: 'sessions/tool/running' },
  'sign-in': { glyph: EMOJIcon.waiting, label: 'sessions/tool/signIn' },
  review: { glyph: EMOJIcon.waiting, label: 'sessions/tool/review' },
  done: { glyph: EMOJIcon.check, label: 'sessions/tool/done' },
  failed: { glyph: EMOJIcon.cross, label: 'sessions/tool/failed' },
  cancelled: { glyph: EMOJIcon.cross, label: 'sessions/tool/cancelled' },
};

/** Clicks inside an agent's text, relative paths from the session's folder. */
function useLinkClicks(): (event: MouseEvent<HTMLElement>) => void {
  return linkClicks(useScena(), useSessionHost(), useContext(WorkspaceContext));
}

/** The icon of each kind of call. */
export const KIND_ICON: Record<ToolKind, string> = {
  terminal: EMOJIcon.terminal,
  read: EMOJIcon.read,
  search: EMOJIcon.search,
  edit: EMOJIcon.edit,
  subagent: EMOJIcon.subagent,
  web: EMOJIcon.web,
  other: EMOJIcon.dot,
};

/** A call's line, each file it names a link that opens the file and leaves the row closed. */
export function ToolLine({ line, file }: { line: string; file: string | undefined }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const workspace = useContext(WorkspaceContext);
  return (
    <span className="web-tool__line">
      {segmentsOf(line, file).map((segment, index) => {
        const target = segment.href === undefined ? null : segment.code === true ? codePath(segment.href, workspace) : fileLink(segment.href, workspace);
        if (target === null) return segment.code === true ? <code key={index}>{segment.text}</code> : <span key={index}>{segment.text}</span>;
        const open = (event: { stopPropagation: () => void; preventDefault: () => void }): void => {
          event.stopPropagation();
          event.preventDefault();
          void scena.commands.execute('ahp.openFile', { uri: target.uri, line: target.line, end: target.end });
        };
        return (
          <span
            key={index}
            role="link"
            tabIndex={0}
            className="web-tool__ref"
            title={t('sessions/attachments/open', { name: folderLabel(target.uri) })}
            onClick={open}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') open(event); }}
          >
            {segment.text}
          </span>
        );
      })}
    </span>
  );
}

/** Text a person may want elsewhere, with a button that copies it. */
export function Block({ title, text }: { title: string; text: string }): ReactElement {
  return (
    <section className="web-tool__block">
      <div className="web-tool__block-head">
        <span>{title}</span>
        <CopyButton text={text} />
      </div>
      <pre className="web-tool__pre">{text}</pre>
    </section>
  );
}

export function OutputView({ out }: { out: Output }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  switch (out.kind) {
    case 'text':
      return <Block title={t('sessions/tool/output')} text={out.text} />;
    case 'terminal': {
      const exit = out.exitCode === undefined ? '' : ` \u{00B7} ${t('sessions/tool/exit', { code: out.exitCode })}`;
      return (
        <Block
          title={`${out.title}${exit}${out.truncated ? ` \u{00B7} ${t('sessions/tool/cutShort')}` : ''}`}
          text={out.text === '' ? t('sessions/tool/noOutput') : out.text}
        />
      );
    }
    case 'file':
      return (
        <p className="web-tool__file">
          <Button variant="link" title={out.before === undefined && out.after === undefined ? t('sessions/tool/openFile') : t('sessions/tool/openChange')} onClick={() => void (out.before === undefined && out.after === undefined
              ? scena.commands.execute('ahp.openFile', { uri: out.file })
              : scena.commands.execute('ahp.openDiff', { file: out.file, ...(out.before === undefined ? {} : { before: out.before }), ...(out.after === undefined ? {} : { after: out.after }) }))}>
            {out.path}
          </Button>
          {out.added === undefined ? null : <span className="web-diff--add">+{out.added}</span>}
          {out.removed === undefined ? null : <Note inline tone="danger">-{out.removed}</Note>}
        </p>
      );
    case 'note':
      return <Note>{out.text}</Note>;
  }
}

/** One tool call: its line, opened to what went in and came out. */
export function ToolCall({ call, send, live, turnId }: { call: ToolCallState; send: Send; live: boolean; turnId: string }): ReactElement {
  const outcome = outcomeOf(call);
  const scena = useScena();
  const host = useSessionHost();
  const chat = useChatUri();
  const ask = useAsks(host, chat).get(call.toolCallId);
  const waiting = live && (outcome === 'approval' || outcome === 'review' || outcome === 'sign-in' || ask !== undefined);
  const [asking, setAsking] = useState(false);
  const [moved, setMoved] = useState(false);
  // The host keeps the flag until the call completes, so a move the host answered is hidden here.
  const movable = live && outcome === 'running' && movableOf(call) && !moved && chat !== null;
  const moveOn = async (): Promise<void> => {
    if (chat === null) return;
    setAsking(true);
    try {
      const answer = await hostBridge(host).request(MOVE_CALL as never, { chat, toolCallId: call.toolCallId } as never) as { backgrounded?: unknown } | undefined;
      setMoved(typeof answer?.backgrounded === 'boolean');
    } catch (error) {
      failed(t('sessions/tool/moveFailed'), error);
    } finally {
      setAsking(false);
    }
  };
  // The setting is the row's first state only; a row a person opened or closed stays so.
  const [open, setOpen] = useState(() => TOOLS_EXPANDED.read(scena.store) === 'expanded');
  const shown = open || waiting;
  const duration = durationOf(call);
  const input = inputText(call);
  const output = outputOf(call);
  const name = call.displayName || call.toolName;
  const risk = call.status === PENDING_CONFIRMATION ? call.riskAssessment : undefined;
  const file = fileOf(call);
  const { t } = useI18n();
  const mark = t(MARK[ask === undefined ? outcome : 'approval'].label);
  return (
    <div className="web-tool" data-outcome={ask === undefined ? outcome : 'approval'}>
      <RowButton fit muted caret="end" expanded={shown} title={mark} onClick={() => setOpen(!open)}>
        <span className="web-tool__mark" aria-label={mark}>{KIND_ICON[kindOf(call)]}</span>
        <ToolLine line={lineOf(call)} file={file} />
        {outcome === 'failed' || outcome === 'cancelled' ? <span className="web-tool__state">{mark}</span> : null}
        {duration === undefined || duration < 1000 ? null : <span className="web-tool__time">{elapsed(duration)}</span>}
      </RowButton>
      {shown ? (
        <div className="web-tool__body">
          <DetailList inline>
            <dt>{t('sessions/tool/tool')}</dt><dd><code>{call.toolName}</code>{name === call.toolName ? null : ` (${name})`}</dd>
            <dt>{t('sessions/tool/status')}</dt><dd>{mark}</dd>
            {file === undefined ? null : (
              <><dt>{t('sessions/tool/file')}</dt><dd><Button variant="link" onClick={() => void scena.commands.execute('ahp.openFile', { uri: file })}>{folderLabel(file)}</Button></dd></>
            )}
            {call.intention === undefined ? null : <><dt>{t('sessions/tool/why')}</dt><dd>{call.intention}</dd></>}
            {risk === undefined || risk.status !== 'complete' ? null : <><dt>{t('sessions/tool/risk')}</dt><dd>{`${t('sessions/tool/safety', { safety: risk.safety })} \u{00B7} ${risk.reason}`}</dd></>}
          </DetailList>
          {input === '' ? null : <Block title={t('sessions/tool/arguments')} text={input} />}
          {output.map((one, index) => <OutputView key={index} out={one} />)}
          {movable ? (
            <Row wrap gap="var(--oo-spacing-sm)">
              <Button label={t('sessions/tool/runInBackground')} disabled={asking} onClick={() => void moveOn()} />
            </Row>
          ) : null}
          {live && ask !== undefined ? <ClientAsk ask={ask} /> : null}
          {live && call.status === PENDING_CONFIRMATION ? <Confirm call={call} send={send} turnId={turnId} /> : null}
          {live && call.status === PENDING_RESULT_CONFIRMATION ? (
            <Row wrap gap="var(--oo-spacing-sm)">
              <Button label={t('sessions/tool/acceptResult')} variant="primary" onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: true } as StateAction)} />
              <Button label={t('sessions/tool/reject')} onClick={() => send({ type: 'chat/toolCallResultConfirmed', turnId, toolCallId: call.toolCallId, approved: false } as StateAction)} />
            </Row>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** One stretch of thinking: its opening words on the line, and opened, the whole text under a line that no longer repeats it. */
export function Reasoning({ text, running }: { text: string; running: boolean }): ReactElement {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const opening = text.replace(/[*_`#>]/g, '').replace(/\s+/g, ' ').trim();
  return (
    <div className="web-tool" data-outcome={running ? 'running' : 'thought'}>
      <RowButton fit muted caret="end" expanded={open} onClick={() => setOpen(!open)}>
        <span className="web-tool__mark" aria-hidden="true">{EMOJIcon.thinking}</span>
        <span className="web-tool__line">{open ? t('sessions/activity/thinking') : t('sessions/tool/thinkingAbout', { text: opening })}</span>
      </RowButton>
      {open ? <div className="web-tool__body web-md"><Markdown text={text} /></div> : null}
    </div>
  );
}

/** One part of an agent's response. `live` is true while its turn still runs. A part the reducer did not touch renders once. */
export const Part = memo(function Part({ part, send, live, turnId }: { part: ResponsePart; send: Send; live: boolean; turnId: string }): ReactElement | null {
  const clicks = useLinkClicks();
  const scena = useScena();
  const { t } = useI18n();
  useStore<string>(SESSION_MARKDOWN.path);
  const markdown = SESSION_MARKDOWN.read(scena.store) === 'enabled';
  switch (String(part.kind)) {
    case 'markdown':
      if (!('content' in part)) return null;
      return markdown
        ? <div className="web-md" onClick={clicks}><Markdown text={part.content as string} /></div>
        : <div className="web-md web-md--plain">{part.content as string}</div>;
    case 'contentRef': {
      const uri = 'uri' in part ? String(part.uri) : '';
      return (
        <Pill label={`${EMOJIcon.file} ${folderLabel(uri).split('/').pop() ?? uri}`} onClick={() => void scena.commands.execute('ahp.openFile', { uri })} />
      );
    }
    case 'reasoning':
      return 'content' in part && part.content !== '' ? <Reasoning text={part.content as string} running={false} /> : null;
    case 'toolCall':
      return 'toolCall' in part ? <ToolCall call={part.toolCall} send={send} live={live} turnId={turnId} /> : null;
    case 'inputRequest':
      return 'request' in part ? <InputRequest request={part.request} send={send} live={live} response={'response' in part && part.response !== undefined ? String(part.response) : undefined} /> : null;
    case 'error':
      return <Alert tone="danger" message={'error' in part && part.error.message !== '' ? part.error.message : t('sessions/tool/agentError')} />;
    case 'systemNotification':
      return <Note>{'content' in part ? textOf(part.content as string) : ''}</Note>;
    default:
      return null;
  }
});
