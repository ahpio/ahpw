import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Button, Donut } from '@softov/scena/ui';
import { ringColor } from './footer.js';

/**
 * How full the context window is, as a ring that fills from the top. Its
 * tooltip is the count, as `24k / 600k`, and a click opens the session's
 * Usage view when there is one.
 */
export function ContextRing({ fraction, text, onOpen }: { fraction: number; text: string; onOpen?: () => void }): ReactElement {
  const { t } = useI18n();
  return (
    <span aria-label={t('sessions/usage/ring', { text, percent: Math.round(fraction * 100) })} role="img">
      <Button variant="borderless" size="sm" title={text} disabled={onOpen === undefined} {...(onOpen === undefined ? {} : { onClick: onOpen })}>
        <Donut size={18} thickness={3} slices={[{ value: fraction, color: ringColor(fraction) }, { value: 1 - fraction, color: 'transparent' }]} />
      </Button>
    </span>
  );
}
