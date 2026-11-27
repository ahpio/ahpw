import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode, Ref } from 'react';
import type { SizeName } from '@softov/scena/styles';
import { appearance, resolveVariableFontSize, resolveVariableSize } from '@softov/scena/styles';
import { weightStyle } from '../_utils.js';
import './Button.css';

// Copied from scena `ui/control/Button.tsx`.
// a2ui v0.10: required `child` (ComponentId for label) + `action` (Action).
// variants 'default'/'primary'/'borderless'. scena's `label`+`onClick` model
// is an extension (Group D — full spec model deferred). `weight` added.
export interface ButtonProps {
  type?: 'button' | 'submit' | 'reset';
  weight?: number;
  title?: string | undefined;
  // scena extensions:
  label?: string;
  // ahpw extension: `link`, `quiet`, `subtle`, `tool` and `filled`.
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'default' | 'borderless' | 'link' | 'quiet' | 'subtle' | 'tool' | 'filled';
  disabled?: boolean | undefined;
  // ahpw extension: the click event.
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  style?: CSSProperties;
  size?: SizeName;
  children?: ReactNode;
  rounded?: SizeName;
  // ahpw extension: a square (`icon`) or a circle (`round`) as tall as `size`, for a button that holds one icon.
  shape?: 'icon' | 'round';
  // ahpw extension: the accessible name, for a button that shows only an icon.
  ariaLabel?: string | undefined;
  // ahpw extension: a toggle's state, read as `aria-pressed` and drawn as active.
  pressed?: boolean | undefined;
  // ahpw extension: drawn as active without being a toggle, such as the open item.
  active?: boolean | undefined;
  // ahpw extension: whether the part this button opens is open.
  expanded?: boolean | undefined;
  // ahpw extension: what this button opens.
  hasPopup?: boolean | 'menu' | 'listbox' | 'dialog';
  // ahpw extension: the item shown now, in a list of places.
  current?: boolean | undefined;
  // ahpw extension: a role other than button, such as `switch` or `menuitem`, and its checked state.
  role?: string | undefined;
  checked?: boolean | undefined;
  // ahpw extension: a colour for the label: the accent, blue, yellow, red or green.
  tone?: 'accent' | 'blue' | 'yellow' | 'red' | 'green' | undefined;
  // ahpw extension: work started by this button is running.
  busy?: boolean | undefined;
  // ahpw extension: the element, and the other events a button needs.
  ref?: Ref<HTMLButtonElement>;
  tabIndex?: number;
  onMouseDown?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: MouseEvent<HTMLButtonElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

// ahpw extension: the side of an icon button, by size.
const BOX: Record<SizeName, string> = { xs: '20px', sm: '24px', md: '28px', lg: '32px' };

export function Button({
  type = 'button',
  title,
  label,
  variant = 'default',
  disabled,
  onClick,
  weight,
  size = 'sm',
  style,
  children,
  rounded = 'sm',
  shape,
  ariaLabel,
  pressed,
  active,
  expanded,
  hasPopup,
  current,
  role,
  checked,
  tone,
  busy,
  ref,
  tabIndex,
  onMouseDown,
  onMouseEnter,
  onKeyDown,
}: ButtonProps) {
  const inlineStyle: CSSProperties = {
    ['--button-padding-y' as string]: `var(${resolveVariableSize(size)})`,
    ['--button-padding-x' as string]: `var(${resolveVariableSize(size)})`,
    ['--button-font-size' as string]: `var(${resolveVariableFontSize(size)})`,
    ['--button-border-radius' as string]: `var(${resolveVariableSize(rounded ?? size)})`,
    ...(shape === undefined ? {} : { ['--button-box' as string]: BOX[size] }),
    ...weightStyle(weight),
    ...style
  };

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      disabled={disabled}
      onClick={(event) => {
        void onClick?.(event);
      }}
      data-variant={variant}
      data-shape={shape}
      data-tone={tone}
      data-active={pressed === true || active === true ? 'true' : undefined}
      className={appearance('oo-btn', { variant })}
      style={inlineStyle}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-haspopup={hasPopup}
      aria-current={current === true ? 'true' : undefined}
      aria-checked={checked}
      aria-busy={busy === true ? true : undefined}
      role={role}
      tabIndex={tabIndex}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onKeyDown={onKeyDown}
    >
      {label ?? children ?? 'Button'}
    </button>
  );
}
