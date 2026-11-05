import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { ringColor } from './footer.js';

/** The ring's radius and its circumference, in the 20-unit box it is drawn in. */
const RADIUS = 7.5;
const AROUND = 2 * Math.PI * RADIUS;

/**
 * How full the context window is, as a ring that fills clockwise from the
 * top. Its tooltip is the count, as `24k / 600k`, and a click opens the
 * session's Usage view when there is one.
 */
export function ContextRing({ fraction, text, onOpen }: { fraction: number; text: string; onOpen?: () => void }): ReactElement {
  const { t } = useI18n();
  const percent = Math.round(fraction * 100);
  return (
    <button
      type="button"
      className="web-context-ring"
      title={text}
      aria-label={t('sessions/usage/ring', { text, percent })}
      disabled={onOpen === undefined}
      onClick={onOpen}
    >
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <circle className="web-context-ring__track" cx="10" cy="10" r={RADIUS} />
        <circle
          className="web-context-ring__fill"
          cx="10"
          cy="10"
          r={RADIUS}
          style={{ stroke: ringColor(fraction) }}
          strokeDasharray={`${fraction * AROUND} ${AROUND}`}
          transform="rotate(-90 10 10)"
        />
      </svg>
    </button>
  );
}
