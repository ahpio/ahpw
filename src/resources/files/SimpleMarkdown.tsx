import type { ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { Alert, Note, Spinner } from '../../ui/index.js';
import { Markdown } from '../../shell/markdown/Markdown.js';
import { EMOJIcon } from '../emojis.js';
import { linkClicks } from './clicks.js';
import { imagesFrom } from './HostImage.js';
import { FileHead, useFileText } from './text.js';
import './simple-markdown.css';
import '../../shell/markdown/markdown.css';
import './shared-file-page.css';

/** The folder a file URI sits in, which its relative links start from. */
export const folderOf = (uri: string): string => uri.replace(/\/[^/]*$/, '');

/**
 * A Markdown file, rendered and read-only: the page where the live preview
 * cannot open, on a host without shared files or for a file that is not text
 * there. Its links and code spans that name files open as they do in chat,
 * and its images are read relative to its folder.
 */
export function SimpleMarkdown({ host, uri }: { host: string; uri: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const state = useFileText(host, uri);
  const head = <FileHead uri={uri} />;
  if (state === null) return <div className="web-file">{head}<Spinner label={t('files/reading')} /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title={t('files/notReadable')} message={state.error} /></div>;
  if (state.text === null) return <div className="web-file">{head}<Note>{t('files/notText')}</Note></div>;
  return (
    <div className="web-file">
      {head}
      <div className="web-file__body">
        <div className="web-file__doc web-md" onClick={linkClicks(scena, host, folderOf(uri))}>
          <Markdown text={state.text} image={imagesFrom(host, folderOf(uri))} />
        </div>
      </div>
      <p className="web-file__simple-note"><span aria-hidden="true">{EMOJIcon.lock}</span> {t('files/simpleNote')}</p>
    </div>
  );
}
