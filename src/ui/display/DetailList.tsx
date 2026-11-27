// Copied from scena `ui/display/DetailList.tsx`.
import type { CSSProperties, ReactNode } from 'react';
import { SectionTitle } from '@softov/scena/ui';
import './DetailList.css';

// Key → value detail block (the "DetailGrid" pattern). Used on resource detail
// pages. `span` items take the full row width — good for long text (a resume,
// an address) that shouldn't sit in a narrow column.
export interface DetailItem {
  label: ReactNode;
  value: ReactNode;
  span?: boolean | undefined;
}

export interface DetailListProps {
  // ahpw extension: `children` may hold `dt` and `dd` pairs in place of `items`, such as pairs only some records have.
  items?: DetailItem[] | undefined;
  children?: ReactNode;
  columns?: number | undefined;        // default 2
  style?: CSSProperties | undefined;
  // ahpw extension: each label beside its value, in two columns, rather than over it.
  inline?: boolean | undefined;
  // ahpw extension: a small heading over the list.
  title?: string | undefined;
}

export function DetailList({ items = [], columns, style, inline, title, children }: DetailListProps) {

  const styleColumns = columns ? `repeat(${columns}, minmax(0, 1fr))` : `repeat(auto-fill, minmax(160px, 1fr))`;
  const list = (
    <dl
      data-inline={inline === true ? 'true' : undefined}

      className="oo-detail-list"
      style={inline === true ? style : { gridTemplateColumns: styleColumns, ...style }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={`oo-detail-list__item${item.span ? ' oo-detail-list__item--span' : ''}`}
        >
          <dt className="oo-detail-list__label">{item.label}</dt>
          <dd className="oo-detail-list__value">{item.value}</dd>
        </div>
      ))}
      {children}
    </dl>
  );
  if (title === undefined) return list;
  return (
    <section className="oo-detail-list__group">
      <SectionTitle>{title}</SectionTitle>
      {list}
    </section>
  );
}
