import { useEffect, useRef, useState, type ReactElement } from 'react';
import { useCloseGuard, useI18n, useScena } from '@softov/scena/react';
import { Alert, Spinner } from '@softov/scena/ui';
import type { EditorView } from '@codemirror/view';
import { hostBridge } from '../../bridges/data.js';
import CodeEditor from '../editor/CodeEditor.js';
import { languageOf } from '../editor/languages.js';
import { EditorDocumentView, sharedEditor } from '../editor/shared.js';
import { EMOJIcon } from '../emojis.js';
import { NameMark } from '../../shell/NameMark.js';
import { SharedDocument, documentChannel, type SaveMode } from './document.js';
import { FILE_SAVE_MODE } from './save-mode.js';
import { FileHead } from './text.js';
import type { FilePageProps } from './FilePage.js';
import './shared.css';

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
  // Read once, when the editor is made: the editor stays the same when Edit unlocks it.
  const [extensions] = useState(() => sharedEditor(() => doc.current));

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

  const people = shared?.everyone() ?? [];
  const head = (
    <FileHead uri={uri} dirty={unsent}>
      <span className="web-file__spacer" />
      <span className="web-file__people">
        {people.map((one) => (
          <span key={one.client} className="web-file__person" title={one.me ? t('files/shared/you', { name: one.name }) : one.name}>
            <NameMark name={one.name} size={24} />
          </span>
        ))}
      </span>
      {locked ? (
        <>
          <span className="web-file__state" title={t('files/shared/locked')} aria-label={t('files/shared/locked')}>{EMOJIcon.lock}</span>
          <button type="button" className="web-icon-button web-icon-button--primary" title={t('files/shared/edit')} aria-label={t('files/shared/edit')} onClick={() => setLocked(false)}>{EMOJIcon.edit}</button>
        </>
      ) : (
        <>
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
      <div className="web-file__body web-file__body--editor" hidden={!open}>
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
      </div>
    </div>
  );
}
