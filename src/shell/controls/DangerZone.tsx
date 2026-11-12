import type { ReactElement, ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';

/** The block at the bottom of a page that holds its destructive action, apart from Save and the other actions: a title, a line on what the action does (that it cannot be undone unless `note` says otherwise), a choice about it in `children`, and the button. */
export function DangerZone({ label, note, onClick, children }: { label: string; note?: string; onClick: () => void; children?: ReactNode }): ReactElement {
  const { t } = useI18n();
  return (
    <section className="web-danger" aria-label={t('common/dangerZone')}>
      <span className="web-danger__title">{t('common/dangerZone')}</span>
      <span className="web-danger__note">{note ?? t('common/cannotUndo')}</span>
      {children}
      <div>
        <Button label={label} variant="danger" size="sm" onClick={onClick} />
      </div>
    </section>
  );
}
