import type { ReactElement } from 'react';
import { useI18n, useStore } from '@softov/scena/react';
import { DetailList, Markdown, Text, type DetailItem } from '@softov/scena/ui';
import type { AgentInfo, SessionSummary } from '@microsoft/agent-host-protocol';
import type { EngineRow, AgentRow } from '../../bridges/agents.js';
import { ahpPaths } from '../../bridges/data.js';
import { NO_OFFERS, type Offers } from '../../bridges/offers.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { AlertList } from '../../shell/view/AlertList.js';
import { meOn, ownerWord } from '../connectors/actions.js';
import { PluginViewPanel } from '../plugins/PluginViewPanel.js';
import { customizationKinds, emptyKinds } from './kinds.js';
import { capabilitiesOf, signInOf } from './words.js';

/**
 * One agent's Overview: what it is, the problems the host found on it, its
 * facts, the view its plugin draws for it, and how to sign in to it. Its
 * models and customizations have tabs of their own; the facts name only the
 * kinds it has none of. An agent the host does not serve has its record's
 * facts only.
 */
export function Overview({ host, info, record, engine }: { host: string; info?: AgentInfo; record?: AgentRow; engine?: EngineRow }): ReactElement {
  const { t } = useI18n();
  const sessions = useStore<SessionSummary[]>(ahpPaths(host).sessions) ?? [];
  const offers = useStore<Offers>(ahpPaths(host).offers) ?? NO_OFFERS;
  const id = info?.provider ?? record?.id ?? '';
  const capabilities = info === undefined ? [] : capabilitiesOf(info);
  const signIn = info === undefined ? [] : signInOf(info);
  const count = sessions.filter((one) => one.provider === id).length;
  // The kinds the tabs have none of; an agent that lists no customizations at all says nothing of them.
  const missing = (info?.customizations ?? []).length === 0 ? [] : emptyKinds(customizationKinds(info?.customizations).filter((tab) => tab.count > 0));
  const facts: DetailItem[] = [
    ...(embedMode() === 'multi' ? [{ label: t('common/host'), value: <HostTag host={host} /> }] : []),
    { label: t('agents/page/facts/provider'), value: <code>{id}</code> },
    ...(record === undefined ? [] : [
      { label: t('agents/page/facts/engine'), value: engine?.title ?? record.engine },
      { label: t('agents/page/facts/owner'), value: ownerWord(t, record.owner, meOn(offers)) },
      ...(engine === undefined ? [] : [{ label: t('agents/page/facts/plugin'), value: <code>{engine.plugin}</code> }]),
      { label: t('agents/page/facts/state'), value: t(`connectors/states/${record.state}`) },
    ]),
    ...(info === undefined ? [] : [
      { label: t('agents/page/facts/sessions'), value: String(count) },
      { label: t('agents/page/facts/can'), value: capabilities.length === 0 ? t('agents/page/oneChat') : capabilities.join('; ') },
      ...(missing.length === 0 ? [] : [{ label: t('agents/page/customizations'), value: t('agents/customizations/noneOf', { kinds: missing.join(', ') }) }]),
    ]),
  ];
  const description = info?.description || record?.description || '';

  return (
    <div className="web-agent__overview">
      {description === '' ? null : <Markdown text={description} />}
      <AlertList alerts={record?.alerts ?? []} />
      <DetailList items={facts} columns={2} />
      {record?.views?.main === undefined || engine === undefined ? null : <PluginViewPanel host={host} plugin={engine.plugin} at={`agent:${record.id}`} view={record.views.main} />}
      <Served signIn={signIn} />
    </div>
  );
}

/** How a person signs in to what the agent serves. */
function Served({ signIn }: { signIn: ReturnType<typeof signInOf> }): ReactElement | null {
  const { t } = useI18n();
  if (signIn.length === 0) return null;
  return (
    <>
      <Text variant="h3" text={t('agents/page/signIn')} />
      <table className="web-runs web-table">
        <thead>
          <tr><th>{t('agents/page/columns/resource')}</th><th>{t('agents/page/columns/scopes')}</th><th /></tr>
        </thead>
        <tbody>
          {signIn.map((one) => (
            <tr key={one.name}><td>{one.name}</td><td>{one.scopes}</td><td>{t(one.required ? 'agents/page/required' : 'agents/page/optional')}</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
