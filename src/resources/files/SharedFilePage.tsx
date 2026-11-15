import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { annotationsReducer, type AnnotationsState, type TextRange } from '@microsoft/agent-host-protocol';
import { useCloseGuard, useI18n, useScena } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { hostBridge } from '../../bridges/data.js';
import { useChannel } from '../../bridges/channel.js';
import CodeEditor from '../editor/CodeEditor.js';
import { languageOf } from '../editor/languages.js';
import { EditorDocumentView, sharedEditor } from '../editor/shared.js';
import { commentsEditor, offsetIn, roomBelow, setComments, setRoomBelow, setThreadAt } from '../editor/comments.js';
import { EMOJIcon } from '../emojis.js';
import { NameMark } from '../../shell/NameMark.js';
import { SharedDocument, documentChannel, type DocumentPerson, type PersonKind, type SaveMode } from './document.js';
import { FILE_SAVE_MODE } from './save-mode.js';
import { FileHead } from './text.js';
import { commentsChannel, commentsOf, isOutdated, newComment, remove, reply, resolve, textOf } from './comments.js';
import { NewComment, Thread, type ThreadActions } from './Threads.js';
import type { FilePageProps } from './FilePage.js';
import './shared.css';

/** The mark on a person's circle that says what they are; a guest has none. */
/** The key of the new comment's box among the margin's threads. */
const DRAFT = 'draft';

const KIND_MARK: Partial<Record<PersonKind, string>> = { root: EMOJIcon.host, user: EMOJIcon.users, agent: EMOJIcon.agents };

/**
 * A file open in several clients at once, through the host's shared document.
 *
 * It opens locked: read-only, with the others' edits and carets live. Edit
 * unlocks it in the person's save mode, which the `ui.fileSaveMode` setting
 * starts and the page changes for this file. A host that does not serve the
 * document calls `onPlain`, and the plain page takes over.
 */
export function SharedFilePage({ host, uri, line, end, onDirty, onPlain }: FilePageProps & { uri: string; onPlain: () => void }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(true);
  const [mode, setMode] = useState<SaveMode>(() => (FILE_SAVE_MODE.read(scena.store) === 'manual' ? 'manual' : 'live'));
  const [refused, setRefused] = useState<string | null>(null);
  const [, redraw] = useState(0);
  const view = useRef<EditorView | null>(null);
  const doc = useRef<SharedDocument | undefined>(undefined);
  /** The text the document set before the editor was made, put in once it is. */
  const early = useRef<string | undefined>(undefined);
  /** The document's view of the editor, which puts the host's text in. */
  const editorView = useRef<EditorDocumentView | undefined>(undefined);
  /** The comment whose thread is open, and the range a new comment is being written on. */
  const [focused, setFocused] = useState<string | null>(null);
  const [draft, setDraft] = useState<TextRange | null>(null);
  /** The thread whose card asks before a delete. */
  const [asking, setAsking] = useState<string | null>(null);
  /** The person's selection, with where its add-comment button goes. */
  const [selection, setSelection] = useState<{ range: TextRange; left: number; top: number } | null>(null);
  /** Each comment's line height on the page, and whether the page is too narrow for a margin. */
  const [tops, setTops] = useState<Record<string, number>>({});
  const [narrow, setNarrow] = useState(false);
  const body = useRef<HTMLDivElement | null>(null);
  const margin = useRef<HTMLDivElement | null>(null);
  /** The element a thread under its line is rendered into, which the editor places. */
  const [slot] = useState(() => document.createElement('div'));
  const annotations = useChannel<AnnotationsState>(host, commentsChannel(uri), annotationsReducer).state;
  const comments = useMemo(() => commentsOf(annotations), [annotations]);
  const commentsRef = useRef(comments);
  commentsRef.current = comments;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  /** Where the text starts and ends on the page, so the threads stay where they can be scrolled to. */
  const bounds = useRef({ top: 0, bottom: 0 });
  /** What the editor's own listeners call, read through a ref because the editor is made once. */
  const onUpdate = useRef<(update: ViewUpdate) => void>(() => {});
  // Read once, when the editor is made: the editor stays the same when Edit unlocks it.
  const [extensions] = useState(() => [
    sharedEditor(() => doc.current),
    commentsEditor({
      open: (id) => { setDraft(null); setFocused(id); },
      remove: (id) => { setDraft(null); setFocused(id); setAsking(id); },
      removeTitle: t('files/comments/delete'),
    }),
    EditorView.updateListener.of((update) => { onUpdate.current(update); }),
  ]);

  useEffect(() => {
    const bridge = hostBridge(host);
    const editor = new EditorDocumentView(() => view.current, () => doc.current, () => redraw((n) => n + 1), setRefused);
    editorView.current = editor;
    const shown = {
      current: () => editor.current(),
      reset: (text: string) => { if (view.current === null) early.current = text; else editor.reset(text); },
      apply: editor.apply.bind(editor),
      changed: editor.changed.bind(editor),
      refused: editor.refused.bind(editor),
    };
    const channel = bridge.openChannel(documentChannel(uri), (envelope) => { doc.current?.read(envelope); }, () => { void doc.current?.resubscribe('keep').catch(() => undefined); });
    const made = new SharedDocument(channel, () => bridge.clientId(), shown, mode);
    doc.current = made;
    setOpen(false);
    setLocked(true);
    // A document whose page went first, as React does twice in development, says nothing.
    let alive = true;
    made.start().then(() => { if (alive) setOpen(true); }).catch(() => {
      made.close();
      // The host serves no shared document for this file: the plain page reads it.
      if (alive) onPlain();
    });
    return () => {
      alive = false;
      made.close();
      if (doc.current === made) doc.current = undefined;
    };
    // The document is made once per file; the mode is set on it below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [host, uri]);

  useEffect(() => { doc.current?.setMode(mode); }, [mode]);
  // Everyone sees who is editing, not only reading.
  useEffect(() => { doc.current?.setEditing(!locked); }, [locked, open]);

  const shared = doc.current;
  const unsent = shared?.unsent === true && mode === 'manual';
  useCloseGuard(() => (unsent ? t('files/unsaved') : null));
  useEffect(() => { onDirty?.(unsent); }, [unsent, onDirty]);

  const attach = (made: EditorView | null): void => {
    view.current = made;
    if (made !== null && early.current !== undefined) {
      const text = early.current;
      early.current = undefined;
      editorView.current?.reset(text);
    }
  };

  /** A position in the editor as a line and a character, as a comment's range is. */
  const rangeOf = (from: number, to: number, editor: EditorView): TextRange => {
    const at = (pos: number) => { const line = editor.state.doc.lineAt(pos); return { line: line.number - 1, character: pos - line.from }; };
    return { start: at(from), end: at(to) };
  };
  /** Each comment's line, at the height it is on the page now. */
  const measure = (editor: EditorView): void => {
    const box = body.current?.getBoundingClientRect();
    if (box === undefined) return;
    const next: Record<string, number> = {};
    const topOf = (range: TextRange): number => editor.lineBlockAt(offsetIn(editor.state.doc, range.start.line, range.start.character)).top + editor.documentTop - box.top;
    for (const one of commentsRef.current) if (one.range !== undefined) next[one.id] = topOf(one.range);
    if (draftRef.current !== null) next[DRAFT] = topOf(draftRef.current);
    bounds.current = { top: editor.documentTop - box.top, bottom: editor.lineBlockAt(editor.state.doc.length).bottom + editor.documentTop - box.top };
    // A new object only when a height moved, so the page is not drawn again for nothing.
    setTops((was) => (Object.keys(next).length === Object.keys(was).length && Object.entries(next).every(([id, top]) => was[id] === top) ? was : next));
  };
  onUpdate.current = (update) => {
    const editor = update.view;
    if (update.selectionSet || update.docChanged) {
      const main = editor.state.selection.main;
      const box = body.current?.getBoundingClientRect();
      const at = main.empty || box === undefined ? null : editor.coordsAtPos(main.from);
      setSelection(at === null || box === undefined ? null : { range: rangeOf(main.from, main.to, editor), left: at.left - box.left, top: at.top - box.top });
    }
    if (update.docChanged || update.geometryChanged || update.viewportChanged) measure(editor);
  };
  // The editor's scroll moves the threads with their lines.
  useEffect(() => {
    const editor = view.current;
    if (editor === null || !open) return undefined;
    const moved = (): void => { measure(editor); };
    editor.scrollDOM.addEventListener('scroll', moved);
    return () => { editor.scrollDOM.removeEventListener('scroll', moved); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  // A page too narrow for a margin opens a thread under its line.
  useEffect(() => {
    const element = body.current;
    if (element === null) return undefined;
    const watch = new ResizeObserver(() => { setNarrow(element.getBoundingClientRect().width < 640); });
    watch.observe(element);
    return () => { watch.disconnect(); };
  }, []);
  // The marks follow the comments and the open thread.
  useEffect(() => {
    const editor = view.current;
    if (editor === null) return;
    editor.dispatch({ effects: setComments.of(comments.filter((one) => one.range !== undefined && !one.resolved).map((one) => ({ id: one.id, range: one.range!, outdated: isOutdated(one), focused: one.id === focused, label: one.entries[0] === undefined ? '' : textOf(one.entries[0]) }))) });
    measure(editor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments, focused, open, draft]);
  /*
   * Under its line, at narrow widths: the box for a new comment, or every
   * thread that starts on the open thread's line, since the gutter marks a
   * line once. The block goes under the last line those threads cover.
   */
  const openStart = comments.find((c) => c.id === focused)?.range?.start.line;
  const onLine = openStart === undefined ? [] : comments.filter((c) => c.range?.start.line === openStart);
  const under = !narrow ? null
    : draft !== null ? { id: DRAFT, line: draft.end.line }
    : openStart === undefined ? null
    : { id: `line:${openStart}`, line: Math.max(...onLine.map((c) => c.range!.end.line)) };
  useEffect(() => {
    view.current?.dispatch({ effects: setThreadAt.of(under === null ? null : { ...under, dom: slot }) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [under?.id, under?.line, slot]);
  /*
   * The threads in the margin, each at its line, none over another. The open
   * thread, or the new comment's box, sits at its line; the threads before it
   * move up out of its way, and the ones after it move down. The editor gets
   * room below its last line for a thread pushed past the end of the text.
   */
  useLayoutEffect(() => {
    const inner = margin.current;
    const editor = view.current;
    if (inner === null || editor === null) return;
    const slots = [...inner.children] as HTMLElement[];
    const gap = 8;
    const wanted = slots.map((one) => Number(one.dataset.top ?? 0));
    const heights = slots.map((one) => one.offsetHeight);
    const tops = [...wanted];
    const anchor = slots.findIndex((one) => one.dataset.anchor === 'true');
    const down = (from: number): void => {
      for (let i = from; i < slots.length; i += 1) if (i > 0) tops[i] = Math.max(wanted[i]!, tops[i - 1]! + heights[i - 1]! + gap);
    };
    if (anchor > 0) {
      for (let i = anchor - 1; i >= 0; i -= 1) tops[i] = Math.min(wanted[i]!, tops[i + 1]! - heights[i]! - gap);
      // Threads moved above the start of the text could not be scrolled to: they start there, and push the rest down.
      if (tops[0]! < bounds.current.top) {
        tops[0] = Math.max(wanted[0]!, bounds.current.top);
        down(1);
      } else down(anchor + 1);
    } else down(0);
    slots.forEach((one, i) => { one.style.top = `${tops[i]}px`; });
    const last = slots.length === 0 ? 0 : tops[slots.length - 1]! + heights[slots.length - 1]! + gap;
    const room = Math.max(0, Math.ceil(last - bounds.current.bottom));
    if (room !== roomBelow(editor.state)) editor.dispatch({ effects: setRoomBelow.of(room) });
  });

  const send = (action: Record<string, unknown>): void => {
    void hostBridge(host).dispatchAndWait(commentsChannel(uri), action as never).then((reason) => { if (reason !== null) setRefused(reason); }).catch(() => undefined);
  };
  const actions: ThreadActions = {
    reply: (id, text) => { send(reply(id, text)); },
    resolve: (id, resolved) => { send(resolve(id, resolved)); if (resolved) setFocused(null); },
    remove: (id) => { send(remove(id)); setFocused(null); },
    askRemove: setAsking,
    focus: (id) => { setDraft(null); setFocused(id); },
  };
  const add = (text: string): void => {
    if (draft === null) return;
    send(newComment(uri, draft, text));
    setDraft(null);
  };
  const draftBox = draft === null ? null : <NewComment onAdd={add} onCancel={() => setDraft(null)} />;
  /** The margin's threads and the new comment's box, in the order of the text, each once its line is measured. */
  const slotted = [
    ...comments.filter((one) => one.range !== undefined).map((one) => ({ id: one.id, range: one.range!, node: <Thread annotation={one} focused={one.id === focused} confirming={one.id === asking} actions={actions} /> })),
    ...(draft === null ? [] : [{ id: DRAFT, range: draft, node: draftBox }]),
  ]
    .filter((one) => tops[one.id] !== undefined)
    .sort((a, b) => a.range.start.line - b.range.start.line || a.range.start.character - b.range.start.character);

  const people = shared?.everyone() ?? [];
  /**
   * What a click on a person's circle opens: the host panel for root, the
   * person's own profile for a signed-in user who is you, another user's page,
   * and nothing for a guest, who has no profile.
   */
  const opener = (one: DocumentPerson): (() => void) | undefined => {
    if (one.kind === 'root') return () => { void scena.commands.execute('ahp.openHostInfo', { host }); };
    if (one.kind !== 'user') return undefined;
    if (one.me) return () => { void scena.commands.execute('ahp.openProfile', { host }); };
    return () => { void scena.commands.execute('ahp.openUser', { host, id: one.name }); };
  };
  const titleOf = (one: DocumentPerson): string => t('files/shared/person', {
    name: one.me ? t('files/shared/you', { name: one.name }) : one.name,
    kind: t(`files/shared/kinds/${one.kind}`),
    doing: one.editing ? t('files/shared/editingNow') : t('files/shared/viewing'),
  });
  const head = (
    <FileHead uri={uri} dirty={unsent}>
      <span className="web-file__spacer" />
      <span className="web-file__people">
        {people.map((one) => {
          const go = opener(one);
          const title = titleOf(one);
          const mark = KIND_MARK[one.kind];
          return (
            <button key={one.client} type="button" className="web-file__person" title={title} aria-label={title} disabled={go === undefined} onClick={go}>
              <NameMark name={one.name} size={24} />
              {mark === undefined ? null : <span className="web-file__person-kind" aria-hidden="true">{mark}</span>}
              {one.editing ? <span className="web-file__person-editing" aria-hidden="true">{EMOJIcon.edit}</span> : null}
            </button>
          );
        })}
      </span>
      {locked ? (
        <>
          <span className="web-file__state" title={t('files/shared/locked')} aria-label={t('files/shared/locked')}>{EMOJIcon.lock}</span>
          <button type="button" className="web-icon-button web-icon-button--primary" title={t('files/shared/edit')} aria-label={t('files/shared/edit')} onClick={() => setLocked(false)}>{EMOJIcon.edit}</button>
        </>
      ) : (
        <>
          <button type="button" className="web-icon-button" disabled={unsent} title={unsent ? t('files/shared/saveFirst') : t('files/shared/stopEditing')} aria-label={t('files/shared/stopEditing')} onClick={() => setLocked(true)}>{EMOJIcon.lock}</button>
          {mode === 'live' ? (
            <span className="web-file__state" data-busy={shared?.saving === true ? 'true' : 'false'} title={shared?.saving === true ? t('files/shared/saving') : t('files/shared/saved')}>
              {shared?.saving === true ? '◌' : EMOJIcon.check}
            </span>
          ) : null}
          <span className="web-file__mode" role="group" aria-label={t('host/settings/ui/fileSaveMode/title')}>
            <button type="button" className="web-icon-button" aria-pressed={mode === 'live'} title={t('files/shared/liveSave')} aria-label={t('files/shared/liveSave')} onClick={() => setMode('live')}>{EMOJIcon.liveSave}</button>
            <button type="button" className="web-icon-button" aria-pressed={mode === 'manual'} title={t('files/shared/manualSave')} aria-label={t('files/shared/manualSave')} onClick={() => setMode('manual')}>{EMOJIcon.manualSave}</button>
          </span>
          {mode === 'manual' ? (
            <button type="button" className="web-icon-button web-icon-button--primary" disabled={!unsent} title={t('files/shared/saveNow')} aria-label={t('files/shared/saveNow')} onClick={() => shared?.save()}>{EMOJIcon.save}</button>
          ) : null}
        </>
      )}
    </FileHead>
  );

  return (
    <div className="web-file">
      {head}
      {refused === null ? null : <Alert tone="danger" title={t('files/shared/refused')} message={refused} />}
      {open ? null : <Spinner label={t('files/reading')} />}
      <div className="web-file__body web-file__body--editor web-file__body--comments" hidden={!open} ref={body}>
        {selection === null || draft !== null ? null : (
          <button type="button" className="web-icon-button web-icon-button--primary web-file__add-comment" style={{ left: selection.left, top: Math.max(0, selection.top - 26) }}
            title={t('files/comments/add')} aria-label={t('files/comments/add')} onMouseDown={(event) => event.preventDefault()}
            onClick={() => { setFocused(null); setDraft(selection.range); setSelection(null); }}>{EMOJIcon.comment}</button>
        )}
        <CodeEditor
          value=""
          language={languageOf(uri)}
          readOnly={locked}
          line={line ?? null}
          end={end ?? null}
          onSave={() => { if (mode === 'manual') shared?.save(); }}
          extensions={extensions}
          onView={attach}
        />
        {narrow ? null : (
          <div className="web-file__margin">
            <div className="web-file__margin-inner" ref={margin}>
              {slotted.map(({ id, node }) => (
                <div key={id} className="web-file__margin-slot" data-top={tops[id]} data-anchor={id === (draft === null ? focused : DRAFT) ? 'true' : undefined}>{node}</div>
              ))}
            </div>
          </div>
        )}
        {narrow ? createPortal(<div className="web-file__thread-under">{draftBox ?? onLine.map((one) => <Thread key={one.id} annotation={one} focused={one.id === focused} confirming={one.id === asking} actions={actions} />)}</div>, slot) : null}
      </div>
    </div>
  );
}
