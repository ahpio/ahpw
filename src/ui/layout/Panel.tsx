import type { MouseEvent, ReactNode } from 'react';
import { TextField } from '../control/TextField.js';
import './Panel.css';

// ahpw component: a side panel, as an explorer: a title line with its actions,
// any bars under it, a filter, then a body that scrolls, with a notice on top.
export interface PanelProps {
  children: ReactNode;
  // The title line, in small capitals; its tooltip, and the buttons at its end.
  title?: string;
  titleHint?: string;
  actions?: ReactNode;
  // Bars between the title line and the filter.
  bars?: ReactNode;
  // A filter over the body: its text, its name and placeholder, and what typing does.
  filter?: { value: string; label: string; onChange: (next: string) => void };
  // What leads the body, before the notice, such as each host's connection.
  top?: ReactNode;
  // A line over the body, such as what is still loading.
  notice?: ReactNode;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
  // Space around the body, for a panel of plain content rather than a list.
  padded?: boolean;
}

export function Panel({ children, title, titleHint, actions, bars, filter, top, notice, onContextMenu, padded }: PanelProps) {
  return (
    <div className="oo-panel">
      {title === undefined ? null : (
        <div className="oo-panel__title">
          <span className="oo-panel__name" title={titleHint}>{title}</span>
          {actions === undefined || actions === null ? null : <span className="oo-panel__actions">{actions}</span>}
        </div>
      )}
      {bars}
      {filter === undefined ? null : <TextField type="search" compact value={filter.value} placeholder={filter.label} ariaLabel={filter.label} onChange={filter.onChange} />}
      <div className="oo-panel__scroll" data-padded={padded === true ? 'true' : undefined} onContextMenu={onContextMenu}>
        {top}
        {notice === undefined || notice === null ? null : <div className="oo-panel__notice">{notice}</div>}
        {children}
      </div>
    </div>
  );
}
