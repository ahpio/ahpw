// Copied from scena `ui/control/ChoicePicker.tsx`.
import { type ChangeEvent, useEffect, useState } from 'react';
import { useWriteBack } from '@softov/scena/react';
import { weightStyle } from '../_utils.js';
import { Checks, type CheckRuleResolved } from './Checks.js';
import { ControlLabel, ControlHint, ControlError } from './_field-parts.js';
import { useI18n } from '@softov/scena/react';

// a2ui v0.10: required `options`, `value` (DynamicStringList — array!). The
// spec's `variant` is selection mode (multipleSelection/mutuallyExclusive);
// scena's `variant` is display kind (select/radio) — kept as scena extension
// because both are useful. `displayStyle` (checkbox/chips) and `filterable`
// added here. `value` as array is Group D — deferred.

export type ChoiceOption =
  | string
  | { label: string; value: string; disabled?: boolean };

export interface ChoicePickerProps {
  options?: ChoiceOption[] | undefined;
  value?: string | undefined;
  label?: string | undefined;
  displayStyle?: 'checkbox' | 'chips' | undefined;   // a2ui v0.10
  filterable?: boolean | undefined;                  // a2ui v0.10
  weight?: number | undefined;                       // a2ui CatalogComponentCommon
  // scena extensions:
  defaultValue?: string | undefined;
  disabled?: boolean | undefined;
  variant?: 'select' | 'radio' | undefined;
  checks?: CheckRuleResolved[] | undefined;
  // Field chrome — rendered inside the control's own <label>.
  hint?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  typeTag?: string | undefined;
  // Controlled escape hatch for direct-React use. Fires alongside write-back.
  onChange?: (next: string) => void | undefined;
  // ahpw extension: the accessible name of a picker with no visible label.
  ariaLabel?: string | undefined;
}

function normalize(o: ChoiceOption): { label: string; value: string; disabled?: boolean } {
  if (typeof o === 'string') return { label: o, value: o };
  return o;
}

export function ChoicePicker({
  value,
  defaultValue,
  options = [],
  label,
  disabled,
  variant = 'select',
  displayStyle: _displayStyle,
  filterable,
  weight,
  checks,
  hint,
  error,
  required,
  typeTag,
  onChange: onChangeProp,
  ariaLabel,
}: ChoicePickerProps) {
  const { t } = useI18n();
  // displayStyle is accepted for spec parity but visual treatment (chips
  // rendering) is deferred to Group D rework.
  void _displayStyle;

  const writeValue = useWriteBack('value');
  const opts = options.map(normalize);
  const [internal, setInternal] = useState<string>(
    value ?? defaultValue ?? opts[0]?.value ?? '',
  );
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    if (value === undefined) return;
    setInternal((current) => (current === value ? current : value));
  }, [value]);

  function select(next: string): void {
    setInternal(next);
    writeValue(next);
    onChangeProp?.(next);
  }

  function onSelectChange(e: ChangeEvent<HTMLSelectElement>): void {
    select(e.currentTarget.value);
  }

  const visibleOpts = filterable && filter
    ? opts.filter((o) => o.label.toLowerCase().includes(filter.toLowerCase()))
    : opts;

  return (
    <label className="oo-field" style={weightStyle(weight)}>
      <ControlLabel label={label} required={required} typeTag={typeTag} />
      <ControlHint text={hint} />
      {filterable ? (
        <div className="oo-control">
          <input
            className="oo-input"
            type="search"
            placeholder={t('query/filter', 'Filter…')}
            value={filter}
            onChange={(e) => setFilter(e.currentTarget.value)}
            disabled={disabled}
          />
        </div>
      ) : null}
      {variant === 'radio' ? (
        <div className="oo-radios">
          {visibleOpts.map((o) => (
            <label key={o.value} className="oo-radio">
              <input
                type="radio"
                value={o.value}
                checked={internal === o.value}
                disabled={disabled || o.disabled}
                onChange={() => select(o.value)}
              />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <select
          className="oo-select"
          aria-label={ariaLabel}
          value={internal}
          disabled={disabled}
          onChange={onSelectChange}
        >
          {visibleOpts.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      <ControlError text={error} />
      {checks === undefined ? null : <Checks checks={checks} />}
    </label>
  );
}
