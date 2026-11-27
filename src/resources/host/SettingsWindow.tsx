import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { embedMode } from '../../shell/embed/index.js';
import { hostNameOf } from '../../bridges/hosts.js';
import { EMOJIcon } from '../emojis.js';
import SettingsPage from './Settings.js';
import { OpenIn } from './OpenIn.js';
import { settingsKey } from './place.js';
import { Button } from '../../ui/index.js';

/** Where the window sits and how big it is, in CSS pixels. */
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The localStorage key of the window's box; one per browser. */
const BOX_KEY = 'ahpw.settingsWindow';

/** The least the window shrinks to. */
const MIN_W = 360;
const MIN_H = 280;

/** A box that fits the page whole: never smaller than the least, never past an edge. */
function clamp(box: Box): Box {
  const w = Math.min(Math.max(MIN_W, box.w), window.innerWidth);
  const h = Math.min(Math.max(MIN_H, box.h), window.innerHeight);
  const x = Math.max(0, Math.min(box.x, window.innerWidth - w));
  const y = Math.max(0, Math.min(box.y, window.innerHeight - h));
  return { x, y, w, h };
}

function centred(): Box {
  const w = Math.min(1080, Math.round(window.innerWidth * 0.92));
  const h = Math.min(740, Math.round(window.innerHeight * 0.88));
  return { x: Math.round((window.innerWidth - w) / 2), y: Math.round((window.innerHeight - h) / 2), w, h };
}

function keptBox(): Box {
  try {
    const kept = JSON.parse(localStorage.getItem(BOX_KEY) ?? 'null') as Partial<Box> | null;
    if (kept !== null && [kept.x, kept.y, kept.w, kept.h].every((one) => typeof one === 'number')) return clamp(kept as Box);
  } catch {
    // A box that does not read is no box.
  }
  return centred();
}

/**
 * The settings in a floating window on the `overlay` surface: a title bar that
 * drags it, a corner that resizes it, maximize and close. No backdrop, so the
 * page under it stays in use (decision: settings open on the surface a person chose).
 */
export default function SettingsWindow({ host }: { host: string }): ReactElement {
  const { t } = useI18n();
  const scena = useScena();
  const [box, setBox] = useState<Box>(keptBox);
  const [max, setMax] = useState(false);
  const self = useRef<HTMLDivElement>(null);
  const close = (): void => scena.surfaces.close(settingsKey(host));

  useEffect(() => {
    self.current?.focus();
    const refit = (): void => setBox((current) => clamp(current));
    window.addEventListener('resize', refit);
    // Escape closes the window from inside it, and when nothing has the focus: a tab
    // switched inside takes the focused control away, and the focus falls to the page.
    // A menu inside closes on its own Escape and marks it used.
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const at = event.target;
      if (at === document.body || at === document.documentElement || (at instanceof Node && self.current?.contains(at) === true)) close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', refit);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  /** Follow the pointer from a press on the title bar or the corner, and keep the box where it is let go. */
  const follow = (event: ReactPointerEvent, move: (start: Box, dx: number, dy: number) => Box): void => {
    if (event.button !== 0 || max) return;
    event.preventDefault();
    const start = box;
    const from = { x: event.clientX, y: event.clientY };
    let last = start;
    const onMove = (next: PointerEvent): void => {
      last = clamp(move(start, next.clientX - from.x, next.clientY - from.y));
      setBox(last);
    };
    // A drag selects the text it passes over unless the page holds still.
    document.body.style.userSelect = 'none';
    const onUp = (): void => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.userSelect = '';
      try {
        localStorage.setItem(BOX_KEY, JSON.stringify(last));
      } catch {
        // Not kept; the next window opens centred.
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const title = embedMode() === 'multi' ? t('hosts/settingsTab', { host: hostNameOf(scena.store, host) }) : t('host/settings/tab');
  const style = max ? undefined : { left: box.x, top: box.y, width: box.w, height: box.h };
  return (
    <div
      ref={self}
      className="web-settings-window"
      data-max={max ? 'true' : 'false'}
      style={style}
      role="dialog"
      aria-label={title}
      tabIndex={-1}
    >
      <div
        className="web-settings-window__bar"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button') !== null) return;
          follow(event, (start, dx, dy) => ({ ...start, x: start.x + dx, y: start.y + dy }));
        }}
        onDoubleClick={(event) => {
          if ((event.target as HTMLElement).closest('button') === null) setMax(!max);
        }}
      >
        <span className="web-settings-window__icon" aria-hidden="true">{EMOJIcon.settings}</span>
        <span className="web-settings-window__title">{title}</span>
        <OpenIn host={host} />
        <Button variant="subtle" shape="icon" size="md" title={t(max ? 'host/settings/restore' : 'host/settings/maximize')} ariaLabel={t(max ? 'host/settings/restore' : 'host/settings/maximize')} onClick={() => setMax(!max)}>
          {max ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><rect x="1.5" y="3.5" width="7" height="7" /><path d="M3.5 3.5V1.5h7v7h-2" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><rect x="1.5" y="1.5" width="9" height="9" /></svg>
          )}
        </Button>
        <Button variant="subtle" shape="icon" size="md" title={t('host/settings/close')} ariaLabel={t('host/settings/close')} onClick={close}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
        </Button>
      </div>
      <div className="web-settings-window__body">
        <SettingsPage host={host} place="overlay" />
      </div>
      {max ? null : (
        <span
          className="web-settings-window__corner"
          aria-hidden="true"
          onPointerDown={(event) => follow(event, (start, dx, dy) => ({ ...start, w: start.w + dx, h: start.h + dy }))}
        />
      )}
    </div>
  );
}
