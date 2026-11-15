import { useMemo, type ReactElement } from 'react';
import { Markdown as ScenaMarkdown, type MarkdownProps } from '@softov/scena/ui';
import { MermaidDiagram } from './Mermaid.js';
import { splitMermaid } from './split.js';

/**
 * scena's Markdown, with ```mermaid fences drawn as diagrams. A text with no
 * such fence renders exactly as scena's. One with diagrams renders each run
 * around them as its own scena Markdown, so a footnote is listed at the end
 * of its run.
 */
export function Markdown({ text = '', className, style, image }: MarkdownProps): ReactElement {
  const segments = useMemo(() => splitMermaid(text), [text]);
  const passed = { ...(image === undefined ? {} : { image }) };
  if (!segments.some((one) => one.kind === 'mermaid')) {
    return <ScenaMarkdown text={text} {...(className === undefined ? {} : { className })} {...(style === undefined ? {} : { style })} {...passed} />;
  }
  return (
    <div className={['web-markdown', className].filter(Boolean).join(' ')} {...(style === undefined ? {} : { style })}>
      {segments.map((one, at) => one.kind === 'text'
        ? <ScenaMarkdown key={at} text={one.text} {...passed} />
        : <MermaidDiagram key={at} source={one.source} closed={one.closed} />)}
    </div>
  );
}
