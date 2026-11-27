import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { useCloseGuard, useI18n } from '@softov/scena/react';
import { Alert, Button, Note, Spinner } from '../../ui/index.js';
import { hostBridge } from '../../bridges/data.js';
import CodeEditor from '../editor/CodeEditor.js';
import { languageOf } from '../editor/languages.js';
import { changedOnHost, refusesWrite, shownText } from './save.js';
import { FileHead, useFileText, useWrap, WrapButton } from './text.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { SharedFilePage } from './SharedFilePage.js';

/** Why the last save did not land, and whether the host refuses this file's writes. */
interface SaveFailure {
  message: string;
  refused: boolean;
}

/** What a file page is given. */
export interface FilePageProps {
  host: string;
  uri?: string;
  line?: number | null;
  end?: number | null;
  onDirty?: (dirty: boolean) => void;
}

/**
 * A file the daemon can read: shared with everyone who has it open when the
 * host serves shared documents, else in an editor that saves with Mod-s.
 */
export default function FilePage(props: FilePageProps): ReactElement {
  const [plain, setPlain] = useState(false);
  useEffect(() => { setPlain(false); }, [props.host, props.uri]);
  if (plain || props.uri === undefined || !props.uri.startsWith('file:')) return <PlainFilePage {...props} />;
  return <SharedFilePage {...props} uri={props.uri} onPlain={() => setPlain(true)} />;
}

/** A file the daemon can read, in an editor that saves with Mod-s or its Save button, scrolled to the lines a link named. */
function PlainFilePage({ host, uri, line, end, onDirty }: FilePageProps): ReactElement {
  const { t } = useI18n();
  const state = useFileText(host, uri);
  const [dirty, setDirty] = useState(false);
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  /** The text as the host last held it, read or saved. */
  const saved = useRef('');
  /** The text as the editor holds it now. */
  const draft = useRef('');
  const saving = useRef(false);
  /** The version of the file the editor started from; a save is refused once the host holds another. */
  const version = useRef<string | undefined>(undefined);

  const [wrap, setWrap] = useWrap();
  useCloseGuard(() => (dirty ? t('files/unsaved') : null));
  // A holder with no tab of its own, as a modal, learns of unsaved text here.
  useEffect(() => { onDirty?.(dirty); }, [dirty, onDirty]);

  const loaded = state !== null && 'text' in state && state.text !== null ? shownText(state.text) : null;

  useEffect(() => {
    saved.current = loaded?.text ?? '';
    draft.current = saved.current;
    setDirty(false);
    setFailure(null);
    version.current = undefined;
    if (uri === undefined || loaded === null) return;
    let alive = true;
    hostBridge(host).etagOf(uri).then((etag) => { if (alive) version.current = etag; }).catch(() => undefined);
    return () => { alive = false; };
  }, [host, uri, loaded?.text]);

  const change = useCallback((text: string) => {
    draft.current = text;
    setDirty(text !== saved.current);
  }, []);

  const save = useCallback((text: string) => {
    if (uri === undefined || saving.current) return;
    saving.current = true;
    hostBridge(host).writeText(uri, text, version.current)
      .then(async () => {
        saved.current = text;
        setDirty(draft.current !== text);
        setFailure(null);
        version.current = await hostBridge(host).etagOf(uri).catch(() => undefined);
      })
      .catch((error: unknown) => {
        const message = changedOnHost(error)
          ? t('files/changedOnHost')
          : error instanceof Error ? error.message : String(error);
        setFailure({ message, refused: refusesWrite(error) });
      })
      .finally(() => { saving.current = false; });
  }, [host, uri, t]);

  if (uri === undefined) return <PageAlert tone="warning" message={t('files/noFile')} />;
  const head = <FileHead uri={uri} dirty={dirty} />;
  if (state === null) return <div className="web-file">{head}<Spinner label={t('files/reading')} /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title={t('files/notReadable')} message={state.error} /></div>;
  if (loaded === null) return <div className="web-file">{head}<Note>{t('files/notText')}</Note></div>;

  const readOnly = loaded.cut || failure?.refused === true;
  return (
    <div className="web-file">
      <FileHead uri={uri} dirty={dirty}>
        <WrapButton wrap={wrap} onChange={setWrap} />
        {readOnly ? null : <Button label={t('files/save')} size="sm" variant="primary" disabled={!dirty} onClick={() => save(draft.current)} />}
      </FileHead>
      {failure === null ? null : <Alert tone="danger" title={failure.refused ? t('files/readOnly') : t('files/notSaved')} message={failure.message} />}
      {loaded.cut ? <Note>{t('files/cut')}</Note> : null}
      <div className="web-file__body web-file__body--editor">
        <CodeEditor
          value={loaded.text}
          language={languageOf(uri)}
          readOnly={readOnly}
          line={line ?? null}
          end={end ?? null}
          onChange={change}
          onSave={save}
          wrap={wrap}
          onWrapChange={setWrap}
        />
      </div>
    </div>
  );
}
