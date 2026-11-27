// Copied from scena `ui/forms/DangerZone.tsx`.
import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button } from '../control/Button.js';

export interface DangerZoneProps {
  // Destructive action button label, e.g. "Delete User".
  label: string;
  // Explanation shown above the button.
  description?: ReactNode | undefined;
  // window.confirm text; when set, the action only runs if confirmed.
  //
  // For an `onConfirm` that does NOT ask for itself. Most callers dispatch a
  // command, and a destructive command normally asks on its own - setting this
  // as well makes deleting a two-step confirmation for one action, and this
  // prompt is `window.confirm`, so it also bypasses whatever the application
  // uses to ask everywhere else.
  confirmMessage?: string | undefined;
  onConfirm: () => void | Promise<void>;
  // ahpw extension: a choice about the action, such as what else goes with it, between the description and the button.
  children?: ReactNode | undefined;
}

// A bordered destructive-action block for settings panels (mirrors web's
// DangerZone). Used by SettingsContainer so resources don't re-implement the
// delete affordance.
export function DangerZone({ label, description, confirmMessage, onConfirm, children }: DangerZoneProps): ReactNode {
  // ahpw extension: the title in the person's language, and a description that says the action cannot be undone when none is given.
  const { t } = useI18n();
  function run(): void {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    void onConfirm();
  }
  return (
    <section className="oo-danger-zone" style={wrap} aria-label={t('common/dangerZone')}>
      <div style={title}>⚠︎ {t('common/dangerZone')}</div>
      <div style={desc}>{description ?? t('common/cannotUndo')}</div>
      {children}
      <div>
        <Button label={`🗑︎ ${label}`} variant="danger" size="sm" onClick={run} />
      </div>
    </section>
  );
}

const wrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  // ahpw extension: apart from the form and the actions above it, with no padding at the sides, so its content lines up with theirs.
  marginTop: 'var(--oo-spacing-lg)',
  borderTop: '1px solid rgb(from var(--oo-color-danger) r g b / 0.3)',
  paddingTop: 'var(--oo-spacing-md, 16px)',
  paddingBottom: 'var(--oo-spacing-md, 16px)',
};
const title: CSSProperties = {
  fontSize: 'var(--oo-font-size-sm)',
  // ahpw extension: capitals drawn by the style, so the title stays translatable.
  textTransform: 'uppercase',
  color: 'var(--oo-color-danger)',
};
const desc: CSSProperties = {
  fontSize: 'var(--oo-font-size-xs)',
  color: 'var(--oo-color-muted)',
};
