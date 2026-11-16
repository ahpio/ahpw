/**
 * Whether a fenced block is still open: a reply that is still streaming may
 * end inside a fence with no closing line yet. scena's block hook hands over
 * the fence's body, not whether it closed, and only the fence the text ends
 * in can be open.
 */

/** A fence's opening line, at any indent, as one in a list item is. */
const OPEN = /^\s*(`{3,}|~{3,})/;
/** A closing line: a run of the opening's character and nothing after it. */
const CLOSE = /^\s*(`{3,}|~{3,})\s*$/;

/** Whether `text` ends inside a fence that has no closing line. */
export function endsInFence(text: string): boolean {
  let mark: string | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (mark === null) {
      const open = OPEN.exec(line);
      if (open !== null) mark = open[1]!;
      continue;
    }
    const close = CLOSE.exec(line);
    if (close !== null && close[1]![0] === mark[0] && close[1]!.length >= mark.length) mark = null;
  }
  return mark !== null;
}

/** The lines without their indent, as a body inside a list item is handed over dedented. */
const flat = (text: string): string => text.split(/\r?\n/).map((line) => line.trim()).join('\n').trimEnd();

/** Whether a fence with this body is the one `text` ends inside, still open. */
export function isOpenFence(text: string, body: string): boolean {
  return endsInFence(text) && flat(text).endsWith(flat(body));
}
