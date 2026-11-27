import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Button, Listable, Note, Row, Spinner, TextField } from '../../ui/index.js';
import { readConnectorModels, type ConnectorModels } from '../../bridges/connectors.js';
import { hostSaid } from '../../bridges/said.js';
import { getLocale } from '@softov/scena';
import { plural } from '../../i18n/locales.js';
import { CopyButton } from '../../ui/control/CopyButton.js';
import { tokens, when } from '../sessions/turn.js';
import { matches, priceLine } from './model-rows.js';

/**
 * The models a provider connector serves, as the host lists them for this
 * reader: a search over a table of the name a caller sends, the provider's
 * name, the context and the price. A model the reader may not call is dimmed.
 */
/** A model the reader may not call, dimmed. */
const REFUSED = { opacity: 0.55 };

type ConnectorModel = ConnectorModels['models'][number];

export function Models({ host, id }: { host: string; id: string }): ReactElement {
  const { t } = useI18n();
  const [read, setRead] = useState<ConnectorModels | undefined>(undefined);
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback((): (() => void) => {
    let live = true;
    setBusy(true);
    setFailure(null);
    readConnectorModels(host, id).then(
      (answer) => { if (live) { setRead(answer); setBusy(false); } },
      (caught: unknown) => { if (live) { setFailure(hostSaid(caught)); setBusy(false); } },
    );
    return () => { live = false; };
  }, [host, id]);
  useEffect(load, [load]);

  const shown = useMemo(() => (read?.models ?? []).filter((one) => matches(one, query)), [read, query]);
  const locale = getLocale();

  if (read === undefined && busy) return <Spinner label={t('connectors/models/reading')} />;
  return (
    <>
      {failure === null ? null : <Alert tone="danger" title={t('connectors/models/failed')} message={failure} />}
      {read === undefined ? null : (
        <Listable<ConnectorModel>
          items={shown}
          getKey={(model) => model.model}
          toolbar={(
            <Row align="center" wrap gap="var(--oo-spacing-sm)">
              <TextField type="search" weight={1} value={query} placeholder={t('connectors/models/search')} onChange={setQuery} />
              <Note inline>
                {query === '' ? plural('connectors/models/count', read.models.length) : plural('connectors/models/shown', read.models.length, { shown: shown.length })}
                {read.at === undefined ? null : ` \u{00B7} ${t('connectors/models/at', { when: when(read.at) })}`}
              </Note>
              <Button size="sm" label={t('connectors/models/again')} disabled={busy} onClick={() => { load(); }} />
            </Row>
          )}
          emptyState={<Note>{t('connectors/models/none')}</Note>}
          getRowStyle={(model) => (model.callable === false ? REFUSED : undefined)}
          columns={[
            {
              key: 'model',
              label: t('connectors/models/columns/model'),
              sortable: true,
              titleProps: (model) => (model?.callable === false ? { title: t('connectors/models/refused') } : {}),
              render: (model) => <Row align="center" gap="var(--oo-spacing-xs)"><code>{model.model}</code><CopyButton text={model.model} label={t('connectors/models/copy')} /></Row>,
            },
            { key: 'name', label: t('connectors/models/columns/name'), sortable: true, render: (model) => model.name ?? '' },
            { key: 'context', label: t('connectors/models/columns/context'), align: 'right', render: (model) => (model.context_length === undefined ? '' : tokens(model.context_length)) },
            {
              key: 'price',
              label: t('connectors/models/columns/price'),
              align: 'right',
              titleProps: (model) => (model === undefined ? { title: t('connectors/models/priceHint') } : {}),
              render: (model) => priceLine(model, locale) ?? '',
            },
          ]}
        />
      )}
    </>
  );
}
