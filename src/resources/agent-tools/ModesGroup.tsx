import { useSyncExternalStore, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import { ChoicePicker, ItemRow, Section } from '../../ui/index.js';
import { commandTitle, marks, MODES, modeOf, modesNow, setMode, watchModes, type Mode } from './registry.js';

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
      <Section title={t('sessions/agentTools/browser')} count={t('sessions/agentTools/on', { on: all.filter((one) => one.mode !== 'off').length, all: all.length })} small folded={folded} onFold={onFold} />
      {folded ? null : rows.map((one) => (
        <ItemRow
          key={one.id}
          hint={one.id}
          title={one.title}
          line={one.text}
          trail={(
            <ChoicePicker ariaLabel={one.title} options={MODES.map((mode) => ({ value: mode, label: t(`sessions/agentTools/modes/${mode}`) }))} value={one.mode} onChange={(next) => setMode(scena, one.id, next as Mode)} />
          )}
        />
      ))}
    </section>
  );
}
