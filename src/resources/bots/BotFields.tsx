import type { ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { Button } from '@softov/scena/ui';
import { rootReducer, type AgentInfo, type RootState } from '@microsoft/agent-host-protocol';
import { useChannel } from '../../bridges/channel.js';
import { ADAPTERS, adaptersReducer, CONNECTORS, connectorsReducer, servesAdapters, servesConnectors, type AdapterRow, type ConnectorRow } from '../../bridges/connectors.js';
import { ahpPaths, ROOT } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';
import type { OperationsState } from '../../bridges/operations-state.js';
import type { PeopleState } from '../../bridges/people.js';
import { Field } from '../../shell/view/Field.js';
import { Section } from '../../shell/view/Section.js';
import { useSessionSettings } from '../automations/session-settings.js';
import { COMPUTERS, COMPUTERS_SCHEME, computersReducer, type ComputersState } from '../computers/machines.js';
import { EMOJIcon } from '../emojis.js';
import type { ModelChoice } from '../sessions/composer-commands.js';
import { BOT_CHAT_AGENT } from './catalogue.js';
import { freeAlias, withAgent, type BotConnector, type BotDraft } from './draft.js';
import './fields.css';

/** The root config key that names the host's default agent. */
const DEFAULT_AGENT = 'defaultAgent';

/** One choice of a list: its value and its words. */
interface Choice {
  value: string;
  label: string;
}

/** The choices of a list with the held value kept and marked when the host does not list it. */
function keepHeld(choices: Choice[], held: string, known: boolean, missing: (value: string) => string): { choices: Choice[]; gone: boolean } {
  const gone = held !== '' && known && !choices.some((one) => one.value === held);
  return { choices: gone ? [...choices, { value: held, label: missing(held) }] : choices, gone };
}

/** A list field that keeps a value the host no longer lists, marked, until a person picks another. */
function Pick({ label, hint, value, choices, onPick }: { label: string; hint?: string; value: string; choices: Choice[]; onPick: (value: string) => void }): ReactElement {
  return (
    <Field label={label} {...(hint === undefined ? {} : { hint })}>
      <select className="web-field" value={value} onChange={(event) => onPick(event.target.value)}>
        {choices.map((one) => <option key={one.value} value={one.value}>{one.label}</option>)}
      </select>
    </Field>
  );
}

/**
 * What a bot runs on and what it can use: its agent and model, its computer and
 * folder, and its connectors and template. A field shows only where the host
 * serves its list; the template and the folder show on a new bot only.
 */
export function BotFields({ host, offers, fresh, draft, folderPlaceholder, set }: {
  host: string;
  offers: Offers;
  fresh: boolean;
  draft: BotDraft;
  /** The folder a new bot gets when it names none, where the host's bots show it. */
  folderPlaceholder: string;
  set: (change: Partial<BotDraft>) => void;
}): ReactElement {
  const { t } = useI18n();
  const listed = useStore<AgentInfo[]>(ahpPaths(host).agents);
  const agents = (listed ?? []).filter((one) => one.provider !== BOT_CHAT_AGENT);
  const root = useChannel<RootState>(host, ROOT, rootReducer).state;
  const chosen = root?.config?.values[DEFAULT_AGENT];
  const hostDefault = typeof chosen === 'string' && chosen !== '' ? agents.find((one) => one.provider === chosen) : undefined;
  const missing = (value: string): string => t('bots/edit/missing', { name: value });

  const agentList = keepHeld(
    [
      { value: '', label: hostDefault === undefined ? t('automations/defaults/host') : t('bots/edit/hostDefaultNamed', { name: hostDefault.displayName }) },
      ...agents.map((one) => ({ value: one.provider, label: one.displayName })),
    ],
    draft.agent,
    listed !== undefined,
    missing,
  );

  // The models are those of the agent the bot runs on: its own, else the host's default.
  const running = draft.agent !== '' ? draft.agent : hostDefault?.provider ?? '';
  const settings = useSessionSettings(host, agentList.gone ? '' : running, '', {});
  const agent = agents.find((one) => one.provider === running);
  const models: ModelChoice[] = settings.models ?? (agent?.models ?? []).map((one) => ({ id: one.id, name: one.name }));
  const modelList = keepHeld(
    [{ value: '', label: t('automations/defaults/agent') }, ...models.map((one) => ({ value: one.id, label: one.name }))],
    draft.model,
    models.length > 0,
    missing,
  );

  const computers = useChannel<ComputersState>(host, offers.channels.includes(COMPUTERS_SCHEME) ? COMPUTERS : undefined, computersReducer);
  const computerList = computers.state === undefined ? undefined : keepHeld(
    [{ value: '', label: t('bots/edit/computerHost') }, ...computers.state.records.map((one) => ({ value: one.id, label: one.id }))],
    draft.computer,
    true,
    missing,
  );

  const connectorsRead = useChannel<OperationsState<ConnectorRow>>(host, servesConnectors(offers) ? CONNECTORS.channel : undefined, connectorsReducer);
  const adaptersRead = useChannel<PeopleState<AdapterRow>>(host, servesAdapters(offers) ? ADAPTERS.channel : undefined, adaptersReducer);
  const adapterTitle = (name: string): string => adaptersRead.state?.records.find((one) => one.id === name)?.record.title ?? name;
  const connectorChoices: Choice[] = (connectorsRead.state?.records ?? []).flatMap(({ id, record }) => (record.adapter === undefined ? [] : [{
    value: `connectors://${record.adapter}/${id}`,
    label: `${record.title ?? id} (${adapterTitle(record.adapter)})`,
  }]));
  // A host with no connector to pick, for a bot that names none, has nothing to show here.
  const showsConnectors = connectorsRead.state !== undefined && (connectorChoices.length > 0 || draft.connectors.length > 0);
  const setConnector = (at: number, change: Partial<BotConnector>): void =>
    set({ connectors: draft.connectors.map((one, index) => (index === at ? { ...one, ...change } : one)) });
  const addConnector = (): void => {
    const used = draft.connectors.map((one) => one.target);
    const target = connectorChoices.find((one) => !used.includes(one.value))?.value ?? connectorChoices[0]?.value ?? '';
    set({ connectors: [...draft.connectors, { alias: freeAlias(target, draft.connectors.map((one) => one.alias)), target }] });
  };

  const agentHint = agentList.gone
    ? t('bots/edit/agentMissing')
    : fresh ? (draft.agent === '' ? t('bots/edit/agentDefaultHint') : undefined) : t('bots/edit/agentChangeHint');

  const folder = fresh ? (
    <Field label={t('bots/edit/folder')} hint={t('bots/edit/folderHint')}>
      <input className="web-field" value={draft.workspace} placeholder={folderPlaceholder} onChange={(event) => set({ workspace: event.target.value })} />
    </Field>
  ) : null;

  return (
    <>
      <Section icon={EMOJIcon.agents} title={t('bots/edit/runsOn')} />
      <div className="web-form__row">
        <Pick label={t('bots/edit/agent')} {...(agentHint === undefined ? {} : { hint: agentHint })} value={draft.agent} choices={agentList.choices} onPick={(value) => set(withAgent(draft, value))} />
        <Pick label={t('bots/edit/model')} value={draft.model} choices={modelList.choices} onPick={(model) => set({ model })} />
      </div>
      {computerList === undefined ? folder : (
        <div className="web-form__row">
          <Pick label={t('bots/edit/computer')} {...(fresh ? { hint: t('bots/edit/computerHint') } : {})} value={draft.computer} choices={computerList.choices} onPick={(computer) => set({ computer })} />
          {folder}
        </div>
      )}

      {!showsConnectors && !fresh ? null : (
        <Section icon={EMOJIcon.connectors} title={t('bots/edit/canUse')} />
      )}
      {!showsConnectors ? null : (
        <div className="web-form__field">
          <span className="web-input__label">{t('bots/edit/connectors')}</span>
          {draft.connectors.map((one, at) => (
            <div key={at} className="web-bot-connector">
              <input className="web-field web-bot-connector__alias" value={one.alias} aria-label={t('bots/edit/connectorAlias')} onChange={(event) => setConnector(at, { alias: event.target.value })} />
              <select className="web-field" value={one.target} aria-label={t('bots/edit/connectors')} onChange={(event) => setConnector(at, { target: event.target.value })}>
                {keepHeld(connectorChoices, one.target, true, missing).choices.map((choice) => <option key={choice.value} value={choice.value}>{choice.label}</option>)}
              </select>
              <Button label={t('bots/edit/connectorRemove')} onClick={() => set({ connectors: draft.connectors.filter((_, index) => index !== at) })} />
            </div>
          ))}
          {connectorChoices.length === 0 ? null : <div><Button label={t('bots/edit/connectorAdd')} onClick={addConnector} /></div>}
          <span className="web-input__hint">{t('bots/edit/connectorsHint')}</span>
        </div>
      )}
      {fresh ? (
        <Field label={t('bots/edit/template')} hint={t('bots/edit/templateHint')}>
          <input className="web-field" value={draft.template} placeholder={t('bots/edit/templateDefault')} onChange={(event) => set({ template: event.target.value })} />
        </Field>
      ) : null}
    </>
  );
}
