import type { ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import type { EngineRow } from '../../bridges/agents.js';
import { AdapterPicker } from '../connectors/AdapterPicker.js';
import { ChoiceCards, Section } from '../../ui/index.js';

/**
 * The engine of a new agent, picked as a connector's adapter is but always by
 * plugin, since an engine's capabilities do not sort engines; and under it
 * what the record starts from: one of the engine's templates, or a blank one.
 * A made agent's engine is fixed, so it shows the engine alone.
 */
export function EnginePicker({ engines, value, template, labelOf, fixed, onPick, onTemplate }: {
  engines: readonly EngineRow[];
  value: string;
  /** The template the record starts from, by its place in the engine's list, or -1 for a blank record. */
  template: number;
  labelOf: (plugin: string) => string;
  fixed: boolean;
  onPick: (name: string) => void;
  onTemplate: (at: number) => void;
}): ReactElement {
  const { t } = useI18n();
  const engine = engines.find((one) => one.name === value);
  const templates = engine?.templates ?? [];
  return (
    <>
      <AdapterPicker adapters={engines} value={value} labelOf={labelOf} fixed={fixed} onPick={onPick} words={{ label: t('agents/form/engine'), search: t('agents/form/searchEngines'), none: t('agents/form/noEngineMatch') }} grouping="plugin" />
      {fixed || engine === undefined || templates.length === 0 ? null : (
        <>
          <Section title={t('agents/form/startFrom')} small />
          <ChoiceCards
            options={[
              ...templates.map((one, at) => ({ id: String(at), label: one.name, ...(one.description === undefined || one.description === '' ? {} : { hint: one.description }) })),
              { id: '-1', label: t('agents/form/blank') },
            ]}
            picked={[String(template)]}
            many={false}
            onPick={(id) => onTemplate(Number(id))}
          />
        </>
      )}
    </>
  );
}
