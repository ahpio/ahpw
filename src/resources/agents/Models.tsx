import { useMemo, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { Listable, Note, Row, TextField } from '../../ui/index.js';
import type { AgentInfo } from '@microsoft/agent-host-protocol';

type ModelInfo = AgentInfo['models'][number];
import { plural } from '../../i18n/locales.js';
import { matchesModel } from './model-search.js';
import { limitsOf } from './words.js';
import './models.css';

/** The policy states a person reads, under `agents/page/policy/<state>`; an enabled model says nothing. */
const POLICY = new Set(['disabled', 'unconfigured']);

/** An agent's models: a search over a table of each model's name, id, limits and policy. */
export function Models({ agent }: { agent: AgentInfo }): ReactElement {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const shown = useMemo(() => agent.models.filter((one) => matchesModel(one, query)), [agent.models, query]);
  if (agent.models.length === 0) return <Note>{t('agents/page/noModels')}</Note>;
  return (
    <Listable<ModelInfo>
      items={shown}
      getKey={(model) => model.id}
      toolbar={(
        <Row align="center" wrap gap="var(--oo-spacing-sm)">
          <TextField type="search" weight={1} value={query} placeholder={t('connectors/models/search')} onChange={setQuery} />
          <Note inline>
            {query === '' ? plural('connectors/models/count', agent.models.length) : plural('connectors/models/shown', agent.models.length, { shown: shown.length })}
          </Note>
        </Row>
      )}
      emptyState={<Note>{t('agents/page/noModelMatch')}</Note>}
      columns={[
        { key: 'name', label: t('agents/page/columns/name'), sortable: true, render: (model) => model.name },
        { key: 'id', label: t('agents/page/columns/id'), sortable: true, render: (model) => <code>{model.id}</code> },
        {
          key: 'limits',
          label: t('agents/page/columns/limits'),
          render: (model) => (
            <span className="web-limits">
              {limitsOf(model).map((limit) => (
                <span key={limit.title} title={limit.title} aria-label={limit.title}><span aria-hidden="true">{limit.icon}</span>{limit.text}</span>
              ))}
            </span>
          ),
        },
        {
          key: 'policy',
          label: '',
          render: (model) => (model.policyState !== undefined && POLICY.has(String(model.policyState)) ? t(`agents/page/policy/${String(model.policyState)}`) : ''),
        },
      ]}
    />
  );
}
