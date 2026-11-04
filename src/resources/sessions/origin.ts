import type { Message } from '@microsoft/agent-host-protocol';

/** `Message._meta` key: the short line a client draws for a system-initiated message. */
export const SYSTEM_LABEL = 'vscode.chat.systemInitiatedLabel';
/** `Message._meta` key: when `true`, the message is not drawn and its response is. */
export const HIDDEN_REQUEST = 'vscode.chat.requestHiddenFromTranscript';
/** `Message._meta` key: the session and chat that sent the message. */
export const DELEGATION = 'vscode.chat.delegation';

/** Who sent a message that the person did not type, and where it opens. */
export type Source =
  /** Another chat of this session (`chat`), or another session (`session`), from `vscode.chat.delegation`. */
  | { scope: 'chat' | 'session'; session: string; chat?: string }
  /** The agent whose tool call spawned this chat; `chat` is its chat, when the chat's origin names it. */
  | { scope: 'agent'; chat?: string }
  /** An automation run; `automation` is the automation's URI, when the session's origin names it. */
  | { scope: 'automation'; automation?: string };

/** How a turn's message is drawn. */
export type Ask =
  /** The message bubble, under a chip that names its source when it has one. */
  | { kind: 'bubble'; from?: Source }
  /** One muted line, for a message the host started. */
  | { kind: 'notice'; line: string }
  /** Nothing: the host asked for the message to stay out of the transcript. */
  | { kind: 'hidden' };

/** Where a message is drawn: the origins of its chat and of its session, as their summaries hold them. */
export interface Origins {
  chat?: unknown;
  session?: unknown;
}

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
 * The sender of a message by its origin: the parent agent for `tool`, from the
 * chat's `tool` origin, and the automation for `automation`, from the session's
 * automation origin. A sender the host does not name has no target.
 */
function senderOf(message: Message, origins: Origins): Source | undefined {
  const kind = String(message.origin?.kind);
  if (kind === 'tool') {
    const chat = record(origins.chat);
    const parent = String(chat?.kind) === 'tool' ? text(chat?.chat) : undefined;
    return parent === undefined ? { scope: 'agent' } : { scope: 'agent', chat: parent };
  }
  if (kind === 'automation') {
    const session = record(origins.session);
    const automation = String(session?.kind) === 'automation' ? text(session?.automation) : undefined;
    return automation === undefined ? { scope: 'automation' } : { scope: 'automation', automation };
  }
  return undefined;
}

/**
 * How to draw a message, from its origin and the VS Code `_meta` keys.
 *
 * `session` is the URI of the session that holds the message: a delegation
 * from that same session is from another of its chats. `origins` name the
 * sender of an `automation` or `tool` message.
 */
export function askOf(message: Message, session: string | undefined, origins: Origins = {}): Ask {
  const meta = record(message._meta);
  if (meta?.[HIDDEN_REQUEST] === true) return { kind: 'hidden' };
  if (String(message.origin?.kind) === 'systemNotification') {
    return { kind: 'notice', line: text(meta?.[SYSTEM_LABEL]) ?? firstLine(message.text) };
  }
  const from = sourceOf(message, session) ?? senderOf(message, origins);
  return from === undefined ? { kind: 'bubble' } : { kind: 'bubble', from };
}

/** Whether a click on a source's chip has somewhere to go. */
export function opens(from: Source): boolean {
  if (from.scope === 'agent') return from.chat !== undefined;
  if (from.scope === 'automation') return from.automation !== undefined;
  return true;
}
