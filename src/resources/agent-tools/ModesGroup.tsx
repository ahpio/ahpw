import { useSyncExternalStore, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { EMOJIcon } from '../emojis.js';
import { commandTitle, marks, MODES, modeOf, modesNow, setMode, watchModes, type Mode } from './registry.js';
import './modes.css';

/** The commands this browser can give the agent, each with its mode. */
export function ModesGroup({ query, folded, onFold }: { query: string; folded: boolean; onFold: () => void }): ReactElement | null {
  const scena = useScena();
  const { t } = useI18n();
  useSyncExternalStore((changed) => {
    const watch = watchModes(scena, changed);
    return () => watch.dispose();
  }, () => modesNow(scena));
  const all = marks().map((mark) => ({ ...mark, title: commandTitle(scena, mark.id), mode: modeOf(scena, mark.id) }));
  const needle = query.trim().toLowerCase();
  const rows = all.filter((one) => needle === '' || `${one.title}\n${one.id}\n${one.text}`.toLowerCase().includes(needle));
  if (rows.length === 0) return null;
  return (
    <section className="web-tooling__group">
      <button type="button" className="web-tooling__heading" aria-expanded={!folded} onClick={onFold}>
        <span className="web-tooling__caret" aria-hidden="true">{folded ? EMOJIcon.caretRight : EMOJIcon.caretDown}</span>
        <span>{t('sessions/agentTools/browser')}</span>
        <span className="web-tooling__count">{t('sessions/agentTools/on', { on: all.filter((one) => one.mode !== 'off').length, all: all.length })}</span>
      </button>
      {folded ? null : rows.map((one) => (
        <div key={one.id} className="web-tooling__row web-agent-modes__row" title={one.id}>
          <span className="web-tooling__main">
            <span className="web-tooling__name">{one.title}</span>
            <span className="web-tooling__l2">{one.text}</span>
          </span>
          <select className="web-field web-agent-modes__mode" aria-label={one.title} data-on={one.mode !== 'off'} value={one.mode} onChange={(event) => setMode(scena, one.id, event.target.value as Mode)}>
            {MODES.map((mode) => <option key={mode} value={mode}>{t(`sessions/agentTools/modes/${mode}`)}</option>)}
          </select>
        </div>
      ))}
    </section>
  );
}
