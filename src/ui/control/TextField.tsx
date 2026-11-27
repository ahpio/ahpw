// Copied from scena `ui/control/TextField.tsx`.
import { type ChangeEvent, type FocusEvent, type KeyboardEvent, type Ref, useEffect, useId, useState } from 'react';
import { useWriteBack } from '@softov/scena/react';
import { weightStyle } from '../_utils.js';
import { Checks, type CheckRuleResolved } from './Checks.js';
import { ControlLabel, ControlHint, ControlError } from './_field-parts.js';
import './TextField.css';

export type InputType = React.HTMLInputTypeAttribute;
// a2ui v0.10: required `label`. variant ∈ longText/number/shortText/obscured
// (scena maps via `type` + `multiline` — Group D mental-model divergence
// deferred). `weight` added.
export interface TextFieldProps {
  id?: string | undefined;
  label?: string | undefined;
  value?: string | undefined;
  placeholder?: string | undefined;
  weight?: number | undefined;
  // scena extensions:
  defaultValue?: string | undefined;
  type?: InputType | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  multiline?: boolean | undefined;
  rows?: number | undefined;
  // ahpw extension: a date or a time as well as a number.
  min?: number | string | undefined;
  max?: number | string | undefined;
  checks?: CheckRuleResolved[] | undefined;
  // Field chrome — rendered inside the control's own <label> so there is one
  // label per field. SchemaForm passes these; standalone callers can too.
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  typeTag?: string | undefined;
  // Controlled escape hatch for direct-React use (outside a mount, where
  // useWriteBack no-ops). Fires alongside write-back.
  onChange?: (next: string) => void | undefined;
  // ahpw extension: the accessible name of a field with no visible label.
  ariaLabel?: string | undefined;
  // ahpw extension: the input's own props and events.
  autoFocus?: boolean | undefined;
  spellCheck?: boolean | undefined;
  autoComplete?: string | undefined;
  inputMode?: 'text' | 'url' | 'email' | 'search' | 'numeric' | 'decimal' | 'tel' | 'none' | undefined;
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send' | undefined;
  // ahpw extension: the value is refused, for a screen reader.
  invalid?: boolean | undefined;
  // ahpw extension: the list this field steers, and the option the keyboard is on in it, for a combobox.
  ariaControls?: string | undefined;
  ariaActiveDescendant?: string | undefined;
  // ahpw extension: the monospace font, for text such as code or grants.
  mono?: boolean | undefined;
  // ahpw extension: less padding and the small font, for a field in a bar or a popup.
  compact?: boolean | undefined;
  step?: number | undefined;
  name?: string | undefined;
  inputRef?: Ref<HTMLInputElement> | Ref<HTMLTextAreaElement> | undefined;
  onKeyDown?: ((event: KeyboardEvent<HTMLInputElement & HTMLTextAreaElement>) => void) | undefined;
  onFocus?: ((event: FocusEvent<HTMLInputElement & HTMLTextAreaElement>) => void) | undefined;
}

// function getClearId(id?: string, label?: string): string {
//   const base = id ?? label ?? Math.random().toString(16).slice(2, 8);
//   return base.replace(/[^a-zA-Z0-9_-]/g, '');
// }

// Bidirectional: pushes user input through useWriteBack('value'). When
// `value` resolved from a DataBinding, the write-back lands in the store
// and the next render reflects it. When `value` was a literal, write-back
// silently no-ops and the field keeps its internal state.
export function TextField({
  // id: idProps,
  value,
  defaultValue,
  placeholder,
  label,
  type = 'text',
  disabled,
  readOnly,
  multiline,
  rows = 3,
  min,
  max,
  checks,
  weight,
  hint,
  error,
  required,
  typeTag,
  onChange: onChangeProp,
  ariaLabel,
  autoFocus,
  spellCheck,
  autoComplete,
  inputMode,
  enterKeyHint,
  invalid,
  ariaControls,
  ariaActiveDescendant,
  mono,
  compact,
  step,
  name,
  inputRef,
  onKeyDown,
  onFocus,
}: TextFieldProps) {
  // ahpw extension: the events, typed for the one element drawn.
  const keyDown = onKeyDown as ((event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined;
  const focus = onFocus as ((event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void) | undefined;
  // ahpw extension: min and max apply to every type that has a range.
  const ranged = type === 'number' || type === 'date' || type === 'datetime-local' || type === 'time' || type === 'month' || type === 'week';
  // const id = `oo-${getClearId(idProps, label)}`;
  const id = useId();
  const writeValue = useWriteBack('value');
  const [internal, setInternal] = useState<string>(value ?? defaultValue ?? '');

  useEffect(() => {
    if (value === undefined) return;
    setInternal((current) => (current === value ? current : value));
  }, [value]);

  function onChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void {
    const next = e.currentTarget.value;
    setInternal(next);
    writeValue(next);
    onChangeProp?.(next);
  }

  const wrapperStyle = weightStyle(weight);
  return (
    <label className="oo-field" htmlFor={id} style={wrapperStyle}>
      <ControlLabel label={label} required={required} typeTag={typeTag} />
      <ControlHint text={hint} />
      <div className="oo-control">
        {multiline ? (
          <textarea
            id={id}
            className="oo-textarea"
            value={internal}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            rows={rows}
            onChange={onChange}
            ref={inputRef as Ref<HTMLTextAreaElement> | undefined}
            aria-label={ariaLabel}
            autoFocus={autoFocus}
            spellCheck={spellCheck}
            autoComplete={autoComplete}
            inputMode={inputMode}
            enterKeyHint={enterKeyHint}
            aria-invalid={invalid}
            aria-controls={ariaControls}
            aria-activedescendant={ariaActiveDescendant}
            data-mono={mono === true ? 'true' : undefined}
            data-compact={compact === true ? 'true' : undefined}
            name={name}
            onKeyDown={keyDown}
            onFocus={focus}
          />
        ) : (
          <input
            id={id}
            className="oo-input"
            type={type}
            value={internal}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            onChange={onChange}
            min={ranged ? min : undefined}
            max={ranged ? max : undefined}
            step={step}
            ref={inputRef as Ref<HTMLInputElement> | undefined}
            aria-label={ariaLabel}
            autoFocus={autoFocus}
            spellCheck={spellCheck}
            autoComplete={autoComplete}
            inputMode={inputMode}
            enterKeyHint={enterKeyHint}
            aria-invalid={invalid}
            aria-controls={ariaControls}
            aria-activedescendant={ariaActiveDescendant}
            data-mono={mono === true ? 'true' : undefined}
            data-compact={compact === true ? 'true' : undefined}
            name={name}
            onKeyDown={keyDown}
            onFocus={focus}
          />
        )}
      </div>
      <ControlError text={error} />
      {checks === undefined ? null : <Checks checks={checks} />}
    </label>
  );
}
