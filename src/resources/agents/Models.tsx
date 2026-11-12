import { useMemo, useState, type ReactElement } from 'react';
import { useI18n } from '@softov/scena/react';
import { TextField } from '@softov/scena/ui';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { plural } from '../../i18n/locales.js';
import { matchesModel } from './models.js';
import { limitsOf } from './words.js';
import './models.css';

/** The policy states a person reads, under `agents/page/policy/<state>`; an enabled model says nothing. */
const POLICY = new Set(['disabled', 'unconfigured']);

/** An agent's models: a search over a table of each model's name, id, limits and policy. */
export function Models({ agent }: { agent: AgentInfo }): ReactElement {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const shown = useMemo(() => agent.models.filter((one) => matchesModel(one, query)), [agent.models, query]);
  if (agent.models.length === 0) return <p className="web-note">{t('agents/page/noModels')}</p>;
  return (
    <div className="web-agent-models">
      <div className="web-agent-models__head">
        <span className="web-agent-models__search">
          <TextField type="search" value={query} placeholder={t('connectors/models/search')} onChange={setQuery} />
        </span>
        <span className="web-note">
          {query === '' ? plural('connectors/models/count', agent.models.length) : plural('connectors/models/shown', agent.models.length, { shown: shown.length })}
        </span>
      </div>
      {shown.length === 0 ? <p className="web-note">{t('agents/page/noModelMatch')}</p> : (
        <div className="web-agent-models__table">
          <table className="web-runs web-table">
            <thead>
              <tr><th>{t('agents/page/columns/name')}</th><th>{t('agents/page/columns/id')}</th><th>{t('agents/page/columns/limits')}</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((model) => (
                <tr key={model.id}>
                  <td>{model.name}</td>
                  <td><code>{model.id}</code></td>
                  <td>
                    <span className="web-limits">
                      {limitsOf(model).map((limit) => (
                        <span key={limit.title} title={limit.title} aria-label={limit.title}><span aria-hidden="true">{limit.icon}</span>{limit.text}</span>
                      ))}
                    </span>
                  </td>
                  <td>{model.policyState !== undefined && POLICY.has(String(model.policyState)) ? t(`agents/page/policy/${String(model.policyState)}`) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
