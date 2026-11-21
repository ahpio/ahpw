import { useCallback, useRef, useState, type PointerEvent, type ReactElement, type ReactNode } from 'react';
import { Markdown as ScenaMarkdown, type MarkdownBlock, type MarkdownProps } from '@softov/scena/ui';
import { MermaidDiagram } from './Mermaid.js';
import { isOpenFence } from './fences.js';
import { quotesOf } from './quotes.js';
import { CopyButton } from '../controls/CopyButton.js';
import './quote-copy.css';

/** The quote or code block the pointer is over: where its corner is, and what it holds as markdown or code. */
interface Hovered { top: number; right: number; text: string }

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
  const root = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState<Hovered | null>(null);
  // A pointer over a quote, or a tap on it for a touch screen, shows the copy icon at the top right corner of a quote or code block.
  const point = (event: PointerEvent<HTMLDivElement>): void => {
    const box = root.current;
    const target = event.target as HTMLElement;
    if (box === null || target.closest('.web-md-quotes__copy') !== null) return;
    // A code block is copied as the code it shows, the innermost thing under the pointer, even inside a quote.
    const code = target.closest('pre');
    if (code !== null && box.contains(code)) {
      const at = code.getBoundingClientRect();
      const around = box.getBoundingClientRect();
      setOver({ top: at.top - around.top + 2, right: around.right - at.right + 2, text: (code.textContent ?? '').replace(/\n$/, '') });
      return;
    }
    let quote = target.closest('blockquote');
    while (quote?.parentElement?.closest('blockquote') != null) quote = quote.parentElement.closest('blockquote');
    if (quote === null || !box.contains(quote)) { setOver(null); return; }
    const all = Array.from(box.querySelectorAll('blockquote')).filter((one) => one.parentElement?.closest('blockquote') == null);
    const index = all.indexOf(quote);
    const mine = quotesOf(text);
    // The source's own words when the quotes line up with the page; else the words as the page shows them.
    const said = mine.length === all.length ? mine[index] : undefined;
    const rect = quote.getBoundingClientRect();
    const frame = box.getBoundingClientRect();
    setOver({ top: rect.top - frame.top + 2, right: frame.right - rect.right + 2, text: said ?? quote.innerText.trim() });
  };
  return (
    <div ref={root} className="web-md-quotes" onPointerOver={point} onPointerDown={point} onPointerLeave={() => setOver(null)}>
    <ScenaMarkdown
      text={text}
      block={draw}
      {...(className === undefined ? {} : { className })}
      {...(style === undefined ? {} : { style })}
      {...(image === undefined ? {} : { image })}
    />
      {over === null ? null : (
        <span className="web-md-quotes__copy" style={{ top: over.top, right: over.right }}>
          <CopyButton text={over.text} icon="⧉" />
        </span>
      )}
    </div>
  );
}
