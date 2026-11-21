import { createContext, useContext } from 'react';

/** The folder of the session a transcript belongs to, which relative file links resolve against. */
export const WorkspaceContext = createContext<string | null>(null);

/** The host of the session a transcript belongs to; null outside a session page. */
export const SessionHostContext = createContext<string | null>(null);

/** The chat the page shows; null outside a session page. */
export const ChatContext = createContext<string | null>(null);

/** The chat a transcript part is drawn for, or null when no chat is shown. */
export function useChatUri(): string | null {
  return useContext(ChatContext);
}

/** The host of the session page this component is drawn in. */
export function useSessionHost(): string {
  const host = useContext(SessionHostContext);
  if (host === null) throw new Error('A transcript part is drawn outside a session page.');
  return host;
}
