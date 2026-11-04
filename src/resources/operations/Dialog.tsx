import { useState, type ReactElement } from 'react';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Button, Modal, SchemaForm } from '@softov/scena/ui';
import { askFirst, invokeOperation, labelOf } from '../../bridges/operations.js';
import { hostSaid } from '../../bridges/said.js';
import { adapterSchema, configForForm, configForPut } from '../connectors/form.js';
import { JsonCodeEditor } from '../editor/JsonCodeEditor.js';
import { OPERATION_DIALOG, refusedTitle, type OpenDialog } from './run.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : {});

/** The held settings the schema has a field for; a field it does not name would be refused. */
function heldFor(schema: Bag, held: Bag): Bag {
  const fields = bagOf(schema.properties);
  return Object.fromEntries(Object.entries(held).filter(([field]) => field in fields));
}

function OperationForm({ open, onClose }: { open: OpenDialog; onClose: () => void }): ReactElement {
  const { t } = useI18n();
  const input = open.operation.input ?? {};
  const held = heldFor(input, open.held ?? {});
  const schema = adapterSchema(input, held, t('operations/kept'));
  const [value, setValue] = useState<Bag>(() => configForForm(held));
  const [jsonValid, setJsonValid] = useState(true);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const label = labelOf(open.operation);

  const send = async (): Promise<void> => {
    if (!(await askFirst(open.operation))) return;
    setBusy(true);
    setFailure(null);
    try {
      await invokeOperation(open.host, open.channel, open.operation, open.target, configForPut(value, input));
      onClose();
    } catch (error) {
      setFailure(hostSaid(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open title={label} onClose={onClose}>
      <div className="web-changeset-form">
        {open.operation.description === undefined ? null : <p className="web-note">{open.operation.description}</p>}
        <SchemaForm schema={schema} value={value} onChange={setValue} jsonEditor={JsonCodeEditor} onJsonValidChange={setJsonValid} />
        {failure === null ? null : <Alert tone="danger" title={refusedTitle(open.operation)} message={failure} />}
        <div className="web-changeset-form__actions">
          <Button label={t('operations/cancel')} variant="ghost" onClick={onClose} />
          <Button label={label} variant="primary" disabled={busy || !jsonValid} {...(jsonValid ? {} : { title: t('host/settings/fixJson') })} onClick={() => void send()} />
        </div>
      </div>
    </Modal>
  );
}

/** The form of the operation open in `OPERATION_DIALOG`, over the page, drawn from the operation's `input` schema. */
export default function OperationDialog(): ReactElement | null {
  const scena = useScena();
  const open = useStore<OpenDialog | null>(OPERATION_DIALOG);
  if (open === undefined || open === null) return null;
  return (
    <OperationForm
      key={`${open.host}\u{0000}${open.channel}\u{0000}${open.target ?? ''}\u{0000}${open.operation.id}`}
      open={open}
      onClose={() => scena.store.set(OPERATION_DIALOG, null)}
    />
  );
}
