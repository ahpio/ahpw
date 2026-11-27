import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Blocks, Button, type JsonSchemaObject, Note, PageActions, SchemaForm } from '../../ui/index.js';
import { setPluginOption, type PluginRow } from '../../bridges/plugins.js';
import { hostSaid } from '../../bridges/said.js';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';
import { SETTINGS_VIEWS } from '../editor/yamlView.js';
import { rereadAfterChange } from './actions.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : {});

/** The keys whose value differs between two option sets, in either. */
export function changedKeys(held: Bag, edited: Bag): string[] {
  const keys = [...new Set([...Object.keys(held), ...Object.keys(edited)])];
  return keys.filter((key) => JSON.stringify(held[key]) !== JSON.stringify(edited[key]));
}

/**
 * A plugin's options, drawn from the schema its row carries and saved one
 * changed key at a time through `x-ahpd/plugins/options`, which checks each
 * against that schema and says why it refuses. A secret reads `<set>` and is
 * sent only once a new value is typed. The host loads a change at its next
 * start, and marks its root for it.
 */
export function Options({ host, id, row }: { host: string; id: string; row: PluginRow }): ReactElement {
  const { t } = useI18n();
  const schema = (row.optionsSchema ?? {}) as JsonSchemaObject;
  const held = useMemo(() => bagOf(typeof row.spec === 'string' ? undefined : row.spec.options), [row.spec]);
  const [edited, setEdited] = useState<Bag | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [jsonValid, setJsonValid] = useState(true);

  // What the host holds now, whenever it changes.
  useEffect(() => setEdited(null), [held]);

  // A plugin that is off, or that did not load, carries no options schema.
  if (Object.keys(bagOf(schema.properties)).length === 0) return <Note>{t('plugins/options/none')}</Note>;

  const values = edited ?? held;
  const changed = changedKeys(held, values);
  const save = async (): Promise<void> => {
    setBusy(true);
    setFailure(null);
    try {
      // One key at a time: the host checks and writes each on its own, so the first refusal stops the rest.
      for (const key of changed) await setPluginOption(host, id, key, values[key]);
      setSaved(true);
      await rereadAfterChange(host);
    } catch (caught) {
      // The edits stay, so the person corrects the value the host refused.
      setFailure(hostSaid(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Blocks>
      <SchemaForm schema={schema} value={values} baseline={held} onChange={(next) => { setEdited(next); setSaved(false); setFailure(null); }} views={SETTINGS_VIEWS} jsonEditor={JsonCodeEditor} onJsonValidChange={setJsonValid} fieldActions />
      {failure === null ? null : <Alert tone="danger" title={t('plugins/options/failed')} message={failure} />}
      <PageActions>
        <Button label={t('plugins/options/save')} variant="primary" disabled={changed.length === 0 || busy || !jsonValid} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={() => void save()} />
        <Button label={t('plugins/options/reset')} disabled={changed.length === 0 || busy} onClick={() => { setEdited(null); setFailure(null); }} />
        {saved && changed.length === 0 ? <Note inline>{t('plugins/options/saved')}</Note> : null}
      </PageActions>
    </Blocks>
  );
}
