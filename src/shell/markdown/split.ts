/**
 * Mermaid fences in a markdown text, cut out so they can be drawn: scena's
 * Markdown shows every fence as code.
 */

/** A run of markdown, or one ```mermaid fence's diagram source. */
export type Segment =
  | { kind: 'text'; text: string }
  /** `closed` is false while the fence has no closing line yet, as when a reply is still streaming. */
  | { kind: 'mermaid'; source: string; closed: boolean };

/** Any fence's opening line, up to three spaces in, with its language. */
const OPEN = /^ {0,3}(`{3,}|~{3,})\s*([^`\s]*)/;
/** A closing line: the opening's character, at least as many. */
const CLOSE = /^ {0,3}(`{3,}|~{3,})\s*$/;

/** The line that closes a fence opened with `mark`, from `from` on, or -1. */
function closeOf(lines: readonly string[], from: number, mark: string): number {
  for (let at = from; at < lines.length; at += 1) {
    const close = CLOSE.exec(lines[at] ?? '');
    if (close !== null && close[1]![0] === mark[0] && close[1]!.length >= mark.length) return at;
  }
  return -1;
}

/**
 * `text` as markdown runs and diagrams, in order. Only a mermaid fence at the
 * start of a line is cut out: an indented one may be inside a list item, and
 * stays code. A fence of another language is passed over whole, so a mermaid
 * fence shown inside it stays text.
 */
export function splitMermaid(text: string): Segment[] {
  const lines = text.split(/\r?\n/);
  const out: Segment[] = [];
  let prose: string[] = [];
  const flush = (): void => {
    if (prose.length > 0) out.push({ kind: 'text', text: prose.join('\n') });
    prose = [];
  };
  let at = 0;
  while (at < lines.length) {
    const line = lines[at] ?? '';
    const open = OPEN.exec(line);
    if (open === null) {
      prose.push(line);
      at += 1;
      continue;
    }
    const close = closeOf(lines, at + 1, open[1]!);
    const end = close === -1 ? lines.length : close;
    if ((open[2] ?? '').toLowerCase() === 'mermaid' && /^[`~]/.test(line)) {
      flush();
      out.push({ kind: 'mermaid', source: lines.slice(at + 1, end).join('\n'), closed: close !== -1 });
    } else {
      prose.push(...lines.slice(at, close === -1 ? lines.length : close + 1));
    }
    at = end + 1;
  }
  flush();
  return out;
}
