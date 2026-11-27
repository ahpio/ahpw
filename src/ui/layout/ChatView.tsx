import type { ReactNode, Ref, UIEvent } from 'react';
import './ChatView.css';

// ahpw component: a chat: its turns scroll under a head that stays at the top
// and fades into them, then what sits under the turns, then the composer. The
// turns keep a readable width; the scroll spans the page. Compact, as a bot's
// chat beside other things, it keeps less room around the turns.
export interface ChatViewProps {
  head: ReactNode;
  // The turns.
  children: ReactNode;
  scrollRef?: Ref<HTMLDivElement>;
  onScroll?: (event: UIEvent<HTMLDivElement>) => void;
  // Between the turns and the composer, such as a line that says the agent works.
  below?: ReactNode;
  composer?: ReactNode;
  compact?: boolean;
}

export function ChatView({ head, children, scrollRef, onScroll, below, composer, compact }: ChatViewProps) {
  return (
    <div className="oo-chat-view" data-compact={compact === true ? 'true' : undefined}>
      <div ref={scrollRef} className="oo-chat-view__turns" onScroll={onScroll}>
        {/* Inside the scroll, so the turns pass under its faded bottom edge. */}
        <header className="oo-chat-view__head">{head}</header>
        {children}
      </div>
      {below}
      {composer}
    </div>
  );
}
