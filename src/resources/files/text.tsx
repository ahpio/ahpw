import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { hostBridge } from '../../bridges/data.js';
import { readFailure } from './save.js';
import { folderLabel } from '../../bridges/words.js';
import { CopyButton } from '../../shell/controls/CopyButton.js';
import { TEXT_WRAP } from '../editor/wrap.js';
import { EMOJIcon } from '../emojis.js';

/** A file's text: null while it reads, `text: null` when the file is not text. */
export type FileText = { text: string | null } | { error: string } | null;

/** Reads a file through the host `host`, again whenever `host` or `uri` changes. */
export function useFileText(host: string, uri: string | undefined): FileText {
  const [state, setState] = useState<FileText>(null);
  useEffect(() => {
    if (uri === undefined) return;
    let alive = true;
    setState(null);
    hostBridge(host).readText(uri)
      .then((read) => { if (alive) setState({ text: read.text }); })
      .catch((error: unknown) => { if (alive) setState({ error: readFailure(error) }); });
    return () => { alive = false; };
  }, [host, uri]);
  return state;
}

/** The bar above a file: its path, whether it has changes not saved, and a button that copies the path. */
export function FileHead({ uri, dirty = false, children }: { uri: string; dirty?: boolean; children?: ReactNode }): ReactElement {
  const { t } = useI18n();
  const path = folderLabel(uri);
  return (
    <div className="web-file__head">
      <code>{path}</code>
      {dirty ? <span className="web-file__dirty" title={t('files/notSaved')}>{t('files/edited')}</span> : null}
      <CopyButton text={path} label={t('files/copyPath')} />
      {children}
    </div>
  );
}

/** Whether a file's long lines wrap: starts from the text wrap setting, and the page keeps it for this file. */
export function useWrap(): [boolean, (wrap: boolean) => void] {
  const scena = useScena();
  const [wrap, setWrap] = useState(() => TEXT_WRAP.read(scena.store) === 'on');
  return [wrap, setWrap];
}

/** The ↵ button in a file's header: wrap long lines, or keep each on one line. Alt+Z in the editor does the same. */
export function WrapButton({ wrap, onChange }: { wrap: boolean; onChange: (wrap: boolean) => void }): ReactElement {
  const { t } = useI18n();
  const title = wrap ? t('files/wrapOff') : t('files/wrapOn');
  return <button type="button" className="web-icon-button" aria-pressed={wrap} title={title} aria-label={title} onClick={() => onChange(!wrap)}>{EMOJIcon.wrap}</button>;
}
