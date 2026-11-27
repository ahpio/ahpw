import type { ReactNode } from 'react';
import './FormRow.css';

// ahpw component: fields side by side, each taking an equal part of the row
// and at least 12rem, wrapping onto a new line when the row is narrower.
export function FormRow({ children }: { children: ReactNode }) {
  return <div className="oo-form-row">{children}</div>;
}
