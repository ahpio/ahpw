// Copied from scena `ui/display/StatusDot.tsx`.
import type { CSSProperties, ReactNode } from 'react';
import { resolveColorVar, type ResourceColor } from '@softov/scena/sdk';
import './StatusDot.css';

// A state, as a coloured dot, optionally with the word beside it.
//
// The smallest way to say "this thing is in this state" in a list where every
// row has one. `Badge` is the other answer to that question and is a bordered
// pill: right for one or two per screen, too loud for a column of forty. So
// they are separate components rather than a variant, and they share the `tone`
// vocabulary so a status shown as a dot in a list and as a badge in a header is
// the same colour in both.
//
// It carries no state vocabulary of its own. `online`, `waiting`, `closed` are
// the *application's* words, and a component that knew them would have to be
// edited every time an application invented another one.

// ahpw extension: `accent`, for something new to read.
export type StatusDotTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export interface StatusDotProps {
  // Semantic preset. Ignored when `color` is given.
  tone?: StatusDotTone | undefined;
  // Any registered colour, a raw triplet, or a var reference - the same
  // `ResourceColor` the minimap, `Badge` and picker rows take, so a resource's
  // registered colour can drive it directly.
  color?: ResourceColor | undefined;
  // The word beside the dot. Absent renders the dot alone.
  label?: string | number | undefined;
  children?: ReactNode | undefined;
  // Colour the label too. Off by default: a row of coloured words is harder to
  // read than black words with coloured dots beside them.
  tint?: boolean | undefined;
  // Hollow rather than filled, for a state that is not happening.
  outline?: boolean | undefined;
  // px. The default suits a list row; a header can afford more.
  size?: number | undefined;
  // Hover text. Falls back to the label, so a dot on its own still says what it
  // means to anybody who stops on it.
  title?: string | undefined;
  style?: CSSProperties | undefined;
  className?: string | undefined;
  // ahpw extension: work running now, drawn as four small dots that walk in turn, in place of the dot.
  working?: boolean | undefined;
}

export function StatusDot({
  tone,
  color,
  label,
  children,
  tint,
  outline,
  size,
  title,
  style,
  className,
  working,
}: StatusDotProps) {
  const text = label ?? children;
  const inline: CSSProperties = {
    ...(color ? ({ ['--oo-color' as string]: resolveColorVar(color) } as CSSProperties) : {}),
    ...(size ? ({ ['--oo-status-dot-size' as string]: `${size}px` } as CSSProperties) : {}),
  };

  const dot = (
    <span
      className={['oo-status-dot', text == null ? className : undefined]
        .filter(Boolean)
        .join(' ')}
      data-tone={color ? undefined : (tone ?? 'default')}
      data-outline={outline ? 'true' : undefined}
      data-working={working ? 'true' : undefined}
      title={title ?? (text == null ? undefined : String(text))}
      style={text == null ? { ...inline, ...style } : inline}
    >
      {working ? <><i /><i /><i /><i /></> : null}
    </span>
  );

  if (text == null) return dot;

  return (
    <span
      className={['oo-status-dot-wrap', className].filter(Boolean).join(' ')}
      data-tint={tint ? 'true' : undefined}
      style={{ ...inline, ...style }}
    >
      {dot}
      <span className="oo-status-dot-label">{text}</span>
    </span>
  );
}
