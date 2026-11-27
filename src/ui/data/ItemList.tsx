import type { ReactNode } from 'react';
import './ItemList.css';

// ahpw component: the rows of a list, as `ItemRow`s. Boxed, the list draws in
// a bordered surface, and its rows are padded inside it.
export interface ItemListProps {
  children: ReactNode;
  boxed?: boolean;
}

export function ItemList({ children, boxed }: ItemListProps) {
  return (
    <div className="oo-item-list" data-boxed={boxed === true ? 'true' : undefined}>
      {children}
    </div>
  );
}
