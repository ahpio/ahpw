// Copied from scena `ui/overlay/Modal.tsx`.
import { type FormEvent, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useI18n, useWriteBack } from '@softov/scena/react';
import { NAMED_GLYPH } from '@softov/scena/ui/display';

// a2ui v0.10: required `trigger` (ComponentId) + `content` (ComponentId).
// scena's controlled model (`open`/`defaultOpen`/`child`) diverges from spec
// (Group D — deferred). `weight` from CatalogComponentCommon added here.
export interface ModalProps {
  weight?: number | undefined;
  // scena controlled-mode props (extensions; architectural divergence vs spec):
  open?: boolean | undefined;
  defaultOpen?: boolean | undefined;
  title?: string | undefined;
  child?: ReactNode | undefined;
  children?: ReactNode | undefined;
  onClose?: () => void | Promise<void> | undefined;
  dismissable?: boolean | undefined;
  // ahpw extension: a line under the title, read with it as the dialog's description.
  description?: ReactNode | undefined;
  // ahpw extension: the buttons at the foot, at its end.
  actions?: ReactNode | undefined;
  // ahpw extension: the card is a form, and Enter in a field submits it.
  onSubmit?: () => void | undefined;
  // ahpw extension: a question that needs an answer, read as an alert.
  alert?: boolean | undefined;
  // ahpw extension: it covers its nearest positioned parent, not the page, such as a card's own question.
  contained?: boolean | undefined;
}

// Backdrop + centered card. `open` is bindable via `useWriteBack('open')` so
// the modal can close itself when bound to a DataBinding; uncontrolled (literal)
// open just keeps internal state and silently no-ops the write.
export function Modal({
  open,
  defaultOpen,
  title,
  child,
  children,
  onClose,
  dismissable = true,
  description,
  actions,
  onSubmit,
  alert,
  contained,
}: ModalProps) {
  // ahpw extension: the card takes the focus when it opens, not a button, so Enter cannot answer before the question is read; Escape closes it.
  const card = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { t } = useI18n();
  const writeOpen = useWriteBack('open');
  const [internalOpen, setInternalOpen] = useState<boolean>(
    open ?? defaultOpen ?? false,
  );

  useEffect(() => {
    if (open === undefined) return;
    setInternalOpen((current) => (current === open ? current : open));
  }, [open]);

  function close(): void {
    if (!dismissable) return;
    setInternalOpen(false);
    writeOpen(false);
    void onClose?.();
  }

  useEffect(() => {
    if (!internalOpen) return;
    if (!card.current?.contains(document.activeElement)) card.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      close();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalOpen]);

  if (!internalOpen) return null;
  const body = child ?? children;
  // ahpw extension: the card is a form when it submits.
  const Card = (onSubmit === undefined ? 'div' : 'form') as 'div';
  return (
    <div
      onClick={close}
      style={{
        position: contained === true ? 'absolute' : 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <Card
        ref={card}
        tabIndex={-1}
        role={alert === true ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description === undefined ? undefined : descriptionId}
        onClick={(e) => e.stopPropagation()}
        {...(onSubmit === undefined ? {} : { onSubmit: (event: FormEvent) => { event.preventDefault(); onSubmit(); } })}
        style={{
          outline: 'none',
          background: 'var(--oo-color-canvas, #fff)',
          color: 'inherit',
          border: '1px solid var(--oo-color-border)',
          borderRadius: 'var(--oo-radius-sm, 4px)',
          padding: 16,
          minWidth: 320,
          maxWidth: '80vw',
          maxHeight: '80vh',
          overflow: 'auto',
        }}
      >
        {title ? (
          <div
            style={{
              fontWeight: 600,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span id={titleId}>{title}</span>
            {dismissable ? (
              <button
                type="button"
                onClick={close}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'inherit',
                }}
                aria-label={t('common/close', 'Close')}
              >
                {NAMED_GLYPH.closePanel}
              </button>
            ) : null}
          </div>
        ) : null}
        {description === undefined ? null : <p id={descriptionId} style={{ margin: '0 0 12px', color: 'var(--oo-color-muted)' }}>{description}</p>}
        {body}
        {actions === undefined ? null : <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>{actions}</div>}
      </Card>
    </div>
  );
}
