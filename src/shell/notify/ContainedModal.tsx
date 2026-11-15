import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';
import { Button } from '@softov/scena/ui';
import './contained.css';

/**
 * A modal held inside one component, not over the page: it covers its nearest
 * positioned parent, as a card's own question does. The modal takes focus;
 * Escape and a click outside its box close it.
 */
export function ContainedModal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }): ReactElement {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.focus(); }, []);
  return (
    <div className="web-contained" onClick={(event) => { event.stopPropagation(); onClose(); }}>
      <div
        ref={box}
        tabIndex={-1}
        className="web-contained__box"
        role="alertdialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          event.stopPropagation();
          onClose();
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** A question held inside one component, with the button that does it and one that does not. */
export function ContainedConfirm({ title, confirmLabel, cancelLabel, tone = 'default', onConfirm, onCancel }: {
  title: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}): ReactElement {
  return (
    <ContainedModal label={title} onClose={onCancel}>
      <p className="web-contained__title">{title}</p>
      <div className="web-contained__buttons">
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
        <Button type="button" size="sm" variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </ContainedModal>
  );
}
