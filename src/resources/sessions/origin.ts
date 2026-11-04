import type { Message } from '@microsoft/agent-host-protocol';

/** `Message._meta` key: the short line a client draws for a system-initiated message. */
export const SYSTEM_LABEL = 'vscode.chat.systemInitiatedLabel';
/** `Message._meta` key: when `true`, the message is not drawn and its response is. */
export const HIDDEN_REQUEST = 'vscode.chat.requestHiddenFromTranscript';
/** `Message._meta` key: the session and chat that sent the message. */
export const DELEGATION = 'vscode.chat.delegation';

/** Where a delegated message came from. */
export interface Source {
  /** The session that sent it. */
  session: string;
  /** The chat that sent it, when the host names one. */
  chat?: string;
  /** `chat` when the sender is another chat of this session, `session` when it is another session. */
  scope: 'chat' | 'session';
}

/** How a turn's message is drawn. */
export type Ask =
  /** The message bubble, under a chip that names its source when it has one. */
  | { kind: 'bubble'; from?: Source }
  /** One muted line, for a message the host started. */
  | { kind: 'notice'; line: string }
  /** Nothing: the host asked for the message to stay out of the transcript. */
  | { kind: 'hidden' };

const record = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

const text = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined);

/** The first line of a text that holds something. */
export function firstLine(value: string): string {
  return value.split('\n').map((line) => line.trim()).find((line) => line !== '') ?? '';
}

/** The source of a delegated message, from its `vscode.chat.delegation` entry. */
export function sourceOf(message: Message, session: string | undefined): Source | undefined {
  const delegation = record(record(message._meta)?.[DELEGATION]);
  const from = text(delegation?.sourceSession);
  if (from === undefined) return undefined;
  const chat = text(delegation?.sourceChat);
  return { session: from, ...(chat === undefined ? {} : { chat }), scope: from === session ? 'chat' : 'session' };
}

/**
 * How to draw a message, from its origin and the VS Code `_meta` keys.
 *
 * `session` is the URI of the session that holds the message: a delegation
 * from that same session is from another of its chats.
 */
export function askOf(message: Message, session: string | undefined): Ask {
  const meta = record(message._meta);
  if (meta?.[HIDDEN_REQUEST] === true) return { kind: 'hidden' };
  if (String(message.origin?.kind) === 'systemNotification') {
    return { kind: 'notice', line: text(meta?.[SYSTEM_LABEL]) ?? firstLine(message.text) };
  }
  const from = sourceOf(message, session);
  return from === undefined ? { kind: 'bubble' } : { kind: 'bubble', from };
}
