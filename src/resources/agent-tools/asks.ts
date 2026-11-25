import { useMemo, useSyncExternalStore } from 'react';

/** A call to a command set to ask, waiting for a person in this window. */
export interface Ask {
  host: string;
  chat: string;
  toolCallId: string;
  /** The command's title, as the row and the toast name it. */
  title: string;
  /** Runs the call, or answers it as denied. */
  answer(allow: boolean): void;
  /** Sets the command to notify in this browser, and runs each call of it this session waits on. */
  always(): void;
  /** Shows the call's chat in its session page. */
  show(): void;
}

let asks: ReadonlyMap<string, Ask> = new Map();
const listeners = new Set<() => void>();

const put = (next: ReadonlyMap<string, Ask>): void => {
  asks = next;
  for (const one of listeners) one();
};

/** A call's key: two hosts may use one call id. */
export const askKey = (host: string, chat: string, toolCallId: string): string => `${host}\u0000${chat}\u0000${toolCallId}`;

const keyOf = (ask: Ask): string => askKey(ask.host, ask.chat, ask.toolCallId);

export const askAt = (key: string): Ask | undefined => asks.get(key);

/** Shows Allow and Deny on the call. */
export function raiseAsk(ask: Ask): void {
  put(new Map(asks).set(keyOf(ask), ask));
}

/** Takes them away; another window's ask on the same call is its own. */
export function dropAsk(ask: Ask): void {
  if (asks.get(keyOf(ask)) !== ask) return;
  const next = new Map(asks);
  next.delete(keyOf(ask));
  put(next);
}

const subscribe = (changed: () => void): (() => void) => {
  listeners.add(changed);
  return () => listeners.delete(changed);
};

/** The calls of a chat that wait for a person, by call id. */
export function useAsks(host: string, chat: string | null): ReadonlyMap<string, Ask> {
  const all = useSyncExternalStore(subscribe, () => asks);
  return useMemo(() => new Map([...all.values()].filter((one) => one.host === host && one.chat === chat).map((one) => [one.toolCallId, one])), [all, host, chat]);
}
