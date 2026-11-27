import type { ReactNode } from 'react';
import './ChoiceCards.css';

// ahpw component: the answers to one question, one card each, with a mark
// that is round when one may be picked and square when many may. Numbered, a
// card shows the key that picks it. With `other`, a last card holds a text box
// for an answer of the person's own.
export interface ChoiceCard {
  id: string;
  label: string;
  // A line under the label.
  hint?: string;
  // A word after the label in the success colour, such as Recommended.
  tag?: string;
}

export interface ChoiceCardsProps {
  options: readonly ChoiceCard[];
  picked: readonly string[];
  many: boolean;
  onPick: (id: string) => void;
  numbered?: boolean;
  // Picks nothing while true, such as while what the last pick started runs.
  disabled?: boolean;
  // The last card: its mark's name and state, what a click on its mark does, and its text box.
  other?: { label: string; on: boolean; onToggle: () => void; field: ReactNode };
}

export function ChoiceCards({ options, picked, many, onPick, numbered, disabled, other }: ChoiceCardsProps) {
  const role = many ? 'checkbox' : 'radio';
  return (
    <div className="oo-choice-cards" role={many ? 'group' : 'radiogroup'}>
      {options.map((option, index) => {
        const on = picked.includes(option.id);
        return (
          <button key={option.id} type="button" className="oo-choice-cards__card" role={role} aria-checked={on} data-on={on} disabled={disabled} onClick={() => onPick(option.id)}>
            <span className="oo-choice-cards__mark" data-many={many} aria-hidden="true" />
            <span className="oo-choice-cards__body">
              <span className="oo-choice-cards__label">
                {numbered === true ? <span className="oo-choice-cards__key">{index + 1}</span> : null}
                {option.label}
                {option.tag === undefined ? null : <span className="oo-choice-cards__tag">{option.tag}</span>}
              </span>
              {option.hint === undefined ? null : <span className="oo-choice-cards__hint">{option.hint}</span>}
            </span>
          </button>
        );
      })}
      {other === undefined ? null : (
        <div className="oo-choice-cards__card oo-choice-cards__other" data-on={other.on}>
          <button type="button" className="oo-choice-cards__mark" data-many={many} role={role} aria-checked={other.on} aria-label={other.label} onClick={other.onToggle} />
          {other.field}
        </div>
      )}
    </div>
  );
}
