import './StepDots.css';

// ahpw component: one dot per page of a short run of pages, such as the
// questions of one request; the dot of the page shown is filled with the
// accent, a done page's with the muted colour. A click on a dot shows its page.
export interface StepDotsProps {
  // What the dots step through, read with the page shown, for a screen reader.
  label: string;
  // Each page's tooltip.
  titles: readonly string[];
  at: number;
  done: readonly boolean[];
  onPick: (index: number) => void;
}

export function StepDots({ label, titles, at, done, onPick }: StepDotsProps) {
  return (
    <span className="oo-step-dots" role="group" aria-label={label}>
      {titles.map((title, index) => (
        <button
          key={index}
          type="button"
          className="oo-step-dots__dot"
          data-here={index === at}
          data-done={done[index] === true}
          aria-current={index === at ? 'step' : undefined}
          title={title}
          aria-label={title}
          onClick={() => onPick(index)}
        />
      ))}
    </span>
  );
}
