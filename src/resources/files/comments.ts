/**
 * Comments on a file outside any session: the host's `x-ahpd-annotations:<file URI>`.
 *
 * The state, the actions and the reducer are AHP's annotations. A comment
 * written here carries VS Code's `vscode.agentFeedback` meta as a person's
 * comment that is already sent, `kind: user` and `state: submitted`, so an
 * agent's comment tools list it. The host stamps each entry's `_meta.ahpd`
 * with who wrote it and when; this side only reads that.
 */
import type { Annotation, AnnotationEntry, AnnotationsState, TextRange } from '@microsoft/agent-host-protocol';

/** The channel of a file's comments. */
export const commentsChannel = (file: string): string => `x-ahpd-annotations:${file}`;

/** The meta key VS Code and the agent's comment tools read a comment from. */
export const FEEDBACK_META = 'vscode.agentFeedback';

/** Who wrote an entry and when, as the host stamped it. */
export interface Stamp {
  by: string;
  name: string;
  at: string;
}

/** The host's stamp on an entry, or nothing for one written before stamps. */
export const stampOf = (entry: AnnotationEntry): Stamp | undefined => {
  const ahpd = entry._meta?.ahpd as Record<string, unknown> | undefined;
  if (typeof ahpd?.by !== 'string' || typeof ahpd.name !== 'string' || typeof ahpd.at !== 'string') return undefined;
  return { by: ahpd.by, name: ahpd.name, at: ahpd.at };
};

/** An entry's author as VS Code's meta says it, for an entry with no stamp: `agent`, `user` or none. */
export const authorOf = (entry: AnnotationEntry): string | undefined => {
  const slot = entry._meta?.[FEEDBACK_META] as { author?: unknown } | undefined;
  return typeof slot?.author === 'string' ? slot.author : undefined;
};

/** An entry's text, plain or Markdown. */
export const textOf = (entry: AnnotationEntry): string => (typeof entry.text === 'string' ? entry.text : entry.text.markdown);

/** Whether the comment's words were deleted, as the host marks it. */
export const isOutdated = (annotation: Annotation): boolean =>
  (annotation._meta?.ahpd as { outdated?: unknown } | undefined)?.outdated === true;

/** The comments to draw, in the order of the text; one with no entry is none. */
export const commentsOf = (state: AnnotationsState | undefined): Annotation[] =>
  [...(state?.annotations ?? [])]
    .filter((one) => one.entries.length > 0)
    .sort((a, b) => (a.range?.start.line ?? 0) - (b.range?.start.line ?? 0) || (a.range?.start.character ?? 0) - (b.range?.start.character ?? 0));

const newId = (): string => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));

/** A new comment on `range` of `file`, with its first entry. */
export const newComment = (file: string, range: TextRange, text: string): Record<string, unknown> => {
  const id = newId();
  const channel = commentsChannel(file);
  const annotation: Annotation = {
    id,
    // A file page is in no session: the origin is the channel itself.
    origin: { session: channel },
    resource: file,
    range,
    resolved: false,
    entries: [{ id: `${id}:0`, text: { markdown: text }, _meta: { [FEEDBACK_META]: { author: 'user' } } }],
    _meta: { [FEEDBACK_META]: { kind: 'user', state: 'submitted', sessionResource: channel } },
  };
  return { type: 'annotations/set', annotation };
};

/** A reply to a comment. */
export const reply = (annotationId: string, text: string): Record<string, unknown> => ({
  type: 'annotations/entrySet',
  annotationId,
  entry: { id: newId(), text: { markdown: text }, _meta: { [FEEDBACK_META]: { author: 'user' } } },
});

/** Resolve a comment, or open it again. */
export const resolve = (annotationId: string, resolved: boolean): Record<string, unknown> => ({
  type: 'annotations/updated',
  annotationId,
  resolved,
});

/** Remove a comment and its thread. */
export const remove = (annotationId: string): Record<string, unknown> => ({ type: 'annotations/removed', annotationId });
