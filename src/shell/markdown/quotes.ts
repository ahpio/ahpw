/**
 * The top-level quotes of a markdown text, each as the markdown inside it: the
 * lines of a `>` block with one level of `>` taken off. Quotes inside a fenced
 * code block are not quotes. In the order they appear, which is the order the
 * rendered page draws its top-level blockquotes.
 */
export function quotesOf(text: string): string[] {
  const found: string[][] = [];
  let current: string[] | null = null;
  let fence: string | null = null;
  for (const line of text.split('\n')) {
    const mark = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (current === null && fence !== null) {
      if (mark !== undefined && mark[0] === fence[0] && mark.length >= fence.length) fence = null;
      continue;
    }
    const quoted = /^ {0,3}>[ \t]?(.*)$/.exec(line);
    if (quoted !== null) {
      if (current === null) { current = []; found.push(current); }
      current.push(quoted[1] ?? '');
      continue;
    }
    // A lazy continuation: a plain line right after quoted text still belongs to the quote.
    if (current !== null && line.trim() !== '' && mark === undefined && !/^ {0,3}([-*+] |\d+[.)] |#)/.test(line)) {
      current.push(line);
      continue;
    }
    current = null;
    if (mark !== undefined) fence = mark;
  }
  return found.map((lines) => lines.join('\n').trim());
}
