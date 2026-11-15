import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n, useScena } from '@softov/scena/react';
import { livePreview } from '../editor/livePreview.js';
import { Markdown } from '../../shell/markdown/Markdown.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { openHref } from './clicks.js';
import { HostImage, imagesFrom } from './HostImage.js';
import { SharedFilePage } from './SharedFilePage.js';
import { folderOf, SimpleMarkdown } from './SimpleMarkdown.js';

/**
 * A Markdown file as a page people edit live: the shared editor with the live
 * preview, locked until ✎ as the text view is. Where the host serves no shared
 * file, it is the simple rendered page.
 *
 * The preview's images and drawn blocks are rendered here, into the elements
 * the editor makes for them, so they have this page's context.
 */
export default function MarkdownPage({ host, uri }: { host: string; uri?: string }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const [simple, setSimple] = useState(false);
  useEffect(() => { setSimple(false); }, [host, uri]);
  /** What the editor asked to have drawn, by the element it made for it. */
  const [drawings, setDrawings] = useState<ReadonlyMap<HTMLElement, ReactNode>>(new Map());
  // Made once per file: the editor reads its extensions when it is made.
  const [extra] = useState(() => {
    if (uri === undefined) return [];
    const draw = (dom: HTMLElement, node: ReactNode): (() => void) => {
      queueMicrotask(() => { setDrawings((was) => new Map(was).set(dom, node)); });
      return () => { queueMicrotask(() => { setDrawings((was) => { const next = new Map(was); next.delete(dom); return next; }); }); };
    };
    return [livePreview({
      openLink: (href) => { openHref(scena, host, folderOf(uri), href); },
      image: (dom, src, alt) => draw(dom, <HostImage host={host} src={src} alt={alt} base={folderOf(uri)} />),
      // A table or a fenced block, a diagram among them, drawn as the simple page draws it.
      block: (dom, markdown) => draw(dom, <div className="web-md"><Markdown text={markdown} image={imagesFrom(host, folderOf(uri))} /></div>),
    })];
  });
  if (uri === undefined) return <PageAlert tone="warning" message={t('files/noFile')} />;
  if (simple || !uri.startsWith('file:')) return <SimpleMarkdown host={host} uri={uri} />;
  return (
    <>
      <SharedFilePage key={uri} host={host} uri={uri} extra={extra} onPlain={() => setSimple(true)} />
      {[...drawings].map(([dom, node]) => createPortal(node, dom))}
    </>
  );
}
