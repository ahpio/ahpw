import { useEffect, useRef, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Chip, ChoicePicker, TextField } from '@softov/scena/ui';
import './filter-bar.css';

/** What a filter bar holds: a text, a type, the failed items only, and whether the matches are marked rather than kept alone. */
export interface FilterValue<Type extends string = string> {
  text: string;
  type: Type;
  errors: boolean;
  highlight: boolean;
}

/**
 * A filter over a list of steps: a text, a type, *Errors* and *Highlight*,
 * the count, and a clear button. While *Highlight* is on, the count is the
 * place of the current match, with buttons to the previous and next one.
 * The text field takes the focus when the bar opens.
 */
export function FilterBar<Type extends string>({ value, onChange, types, count, onPrevious, onNext, onClear }: {
  value: FilterValue<Type>;
  onChange: (next: FilterValue<Type>) => void;
  /** The types to pick from, each with its words. */
  types: readonly { value: Type; label: string }[];
  /** What the filter keeps, as words: "5 of 41 steps", or "2 of 5" while highlighting. */
  count: string;
  /** Moves to the previous match; shown while highlighting. */
  onPrevious: () => void;
  /** Moves to the next match; shown while highlighting. */
  onNext: () => void;
  onClear: () => void;
}): ReactElement {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.querySelector('input')?.focus(); }, []);
  return (
    <div ref={box} className="web-filter-bar" role="search">
      <div className="web-filter-bar__text">
        <TextField value={value.text} placeholder={t('shell/filter/text')} onChange={(text) => onChange({ ...value, text })} />
      </div>
      <ChoicePicker variant="select" value={value.type} options={types.map((one) => ({ value: one.value, label: one.label }))} onChange={(type) => onChange({ ...value, type: type as Type })} />
      <Chip label={t('shell/filter/errors')} state={value.errors ? 'on' : 'off'} title={t(value.errors ? 'shell/filter/errorsOn' : 'shell/filter/errorsOff')} onClick={() => onChange({ ...value, errors: !value.errors })} />
      <Chip label={t('shell/filter/highlight')} state={value.highlight ? 'on' : 'off'} title={t(value.highlight ? 'shell/filter/highlightOn' : 'shell/filter/highlightOff')} onClick={() => onChange({ ...value, highlight: !value.highlight })} />
      <span className="web-filter-bar__count">{count}</span>
      {value.highlight ? (
        <span className="web-filter-bar__nav">
          <button type="button" className="web-filter-bar__icon" title={t('shell/filter/previous')} aria-label={t('shell/filter/previous')} onClick={onPrevious}>{'\u{2191}'}</button>
          <button type="button" className="web-filter-bar__icon" title={t('shell/filter/next')} aria-label={t('shell/filter/next')} onClick={onNext}>{'\u{2193}'}</button>
        </span>
      ) : null}
      <button type="button" className="web-filter-bar__icon" title={t('shell/filter/clear')} aria-label={t('shell/filter/clear')} onClick={onClear}>{'\u{2715}'}</button>
    </div>
  );
}
