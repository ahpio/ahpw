import type { HTMLAttributes, ReactNode, Ref, TextareaHTMLAttributes } from 'react';
import './MessageBox.css';

// ahpw component: a box to write a message in, as a chat's composer. What is
// attached shows over the text; under it, a foot holds a lead (such as Add), the
// pills on the left, the pills on the right, and the end (such as Send). Its
// edge shows a turn running or waiting on an answer, and a drop over it. With
// `folded`, it holds one line of its children in place of the text.
export interface MessageBoxProps {
  // The text: a `MessageText`, and anything beside it on its line.
  children: ReactNode;
  top?: ReactNode;
  lead?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  end?: ReactNode;
  // The edge: a turn is running, or it waits on an answer from the person.
  ring?: 'running' | 'input' | undefined;
  // What a drop over the box does: attach the file, or mention it.
  drop?: 'attach' | 'mention' | undefined;
  // The box's drop events.
  zone?: HTMLAttributes<HTMLDivElement> | undefined;
  folded?: boolean;
}

export function MessageBox({ children, top, lead, left, right, end, ring, drop, zone, folded }: MessageBoxProps) {
  return (
    <div className="oo-message-box" data-ring={ring} data-drop={drop} data-folded={folded === true ? 'true' : undefined} {...zone}>
      {folded === true ? children : (
        <>
          {top}
          <div className="oo-message-box__bar">{children}</div>
          <div className="oo-message-box__foot">
            {lead}
            <div className="oo-message-box__left">{left}</div>
            <div className="oo-message-box__right">{right}</div>
            {end}
          </div>
        </>
      )}
    </div>
  );
}

// ahpw component: the text of a `MessageBox`, a textarea with no edge of its own.
// `rows` above one is also its least height.
export function MessageText({ rows = 1, style, ref, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: Ref<HTMLTextAreaElement> }) {
  return (
    <textarea
      ref={ref}
      className="oo-message-box__text"
      rows={rows}
      style={rows > 1 ? { minHeight: `calc(${String(rows)} * 1.4em + 12px)`, ...style } : style}
      {...props}
    />
  );
}
