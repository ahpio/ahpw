import { useCallback, type ReactElement, type ReactNode } from 'react';
import { Markdown as ScenaMarkdown, type MarkdownBlock, type MarkdownProps } from '@softov/scena/ui';
import { MermaidDiagram } from './Mermaid.js';
import { isOpenFence } from './fences.js';

/**
 * scena's Markdown, with ```mermaid fences drawn as diagrams through its
 * block hook, wherever they sit: in a list item and in a quote too. A block
 * hook the caller passes is asked first; any block neither draws is scena's.
 */
export function Markdown({ text = '', className, style, image, block }: MarkdownProps): ReactElement {
  const draw = useCallback((one: MarkdownBlock): ReactNode | undefined => {
    const given = block?.(one);
    if (given !== undefined) return given;
    if (one.kind !== 'code' || one.lang !== 'mermaid') return undefined;
    return <MermaidDiagram source={one.body} closed={!isOpenFence(text, one.body)} />;
  }, [block, text]);
  return (
    <ScenaMarkdown
      text={text}
      block={draw}
      {...(className === undefined ? {} : { className })}
      {...(style === undefined ? {} : { style })}
      {...(image === undefined ? {} : { image })}
    />
  );
}
