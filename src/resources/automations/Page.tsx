import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { oneTimeOf, targetOf } from './next.js';
import { translate } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Alert, Badge, Button, DetailList, Text, type DetailItem } from '@softov/scena/ui';
import { Markdown } from '../../shell/markdown/Markdown.js';
import { KeptTabs } from '../../shell/view/KeptTabs.js';
import { automationReducer, type AgentInfo, type AutomationCapabilities, type AutomationEntry, type AutomationState as Catalogue } from '@microsoft/agent-host-protocol';
import { ahpPaths, AUTOMATIONS, hostBridge } from '../../bridges/data.js';
import { embedMode } from '../../shell/embed/index.js';
import { HostTag } from '../../shell/explorer/HostLines.js';
import { useChannel } from '../../bridges/channel.js';
import { elapsed, folderLabel } from '../../bridges/words.js';
import { tokens } from '../sessions/turn.js';
import { cancelRun, remove, runNow, setEnabled } from './actions.js';
import { cronWords, runFacts, runsByTime, stateOf, timeOf, titleOf, type AutomationState } from './words.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { plural } from '../../i18n/locales.js';
import { DangerZone } from '../../shell/controls/DangerZone.js';
import { PageTitle } from '../../shell/HostIcon.js';
import { EMOJIcon } from '../emojis.js';
import { AutomationForm } from './Edit.js';
import { Section } from '../../shell/view/Section.js';
import { useAgentIconSrc } from '../agents/icons.js';
import type { Option } from '../sessions/composer-commands.js';
import { settingLabels } from '../sessions/pill-labels.js';
import { useSessionSettings } from './session-settings.js';
import { AUTOMATION_SECTION, automationTabKey, keepAutomationTabKey, type AutomationAsk } from './state.js';
import { PageSpinner } from '../../shell/view/PageSpinner.js';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info';

const STATE: Record<AutomationState, Tone> = { running: 'info', failed: 'danger', on: 'success', off: 'default' };

/** The tone of each run state the page has words for, under `automations/run/<state>`. */
const RUN: Record<string, Tone> = { pending: 'default', running: 'info', completed: 'success', failed: 'danger', cancelled: 'default' };

/** How a run began: by hand, or by which trigger and for when. */
function originOf(origin: unknown): string {
  const said = origin as { kind?: string; trigger?: string; scheduledFor?: string; catchUp?: boolean };
  if (String(said.kind) !== 'trigger') return translate('automations/origin/byHand');
  const how = said.catchUp === true ? 'catchUp' : 'scheduled';
  if (said.scheduledFor === undefined) return translate(`automations/origin/${how}`);
  return translate(`automations/origin/${how}For`, { time: timeOf(said.scheduledFor) });
}

/** Values that each take a line of their own. */
const lines = (values: readonly ReactNode[]): ReactElement => (
  <span className="web-lines">{values.map((value, index) => <span key={index}>{value}</span>)}</span>
);

/** What the Agent section reads besides the definition: the agent's name and models, and the settings as the host names them. */
interface AgentWords {
  name: string;
  image?: string | undefined;
  /** The model ids the agent offers; empty while unknown. */
  models: readonly string[];
  options: readonly Option[];
}

/** The Agent section: who runs, with which model, where, and with which settings. */
function agentFacts(host: string, entry: AutomationEntry, words: AgentWords): DetailItem[] {
  const session = entry.definition.session;
  const folders = session.workingDirectories ?? [];
  const model = session.model?.id;
  const items: DetailItem[] = [
    ...(embedMode() === 'multi' ? [{ label: translate('common/host'), value: <HostTag host={host} /> }] : []),
    { label: translate('automations/facts/agent'), value: <span className="web-automation__agent">{words.image === undefined ? null : <img src={words.image} alt="" />}{words.name}</span> },
    {
      label: translate('automations/facts/model'),
      value: model === undefined ? translate('automations/defaults/agent') : (
        <span className="web-automation__agent">{model}{words.models.length === 0 || words.models.includes(model) ? null : <Badge tone="warning" text={translate('automations/facts/notOffered')} />}</span>
      ),
    },
  ];
  if (folders.length > 0) items.push({ label: translate('automations/facts/folder'), value: lines(folders.map(folderLabel)) });
  if (session.agent !== undefined) items.push({ label: translate('automations/facts/customAgent'), value: session.agent.uri });
  const config = session.config ?? {};
  if (Object.keys(config).length > 0) {
    // The host's names for the settings once it answers; the keys as stored until then.
    const named = words.options.filter((option) => option.key in config);
    const shown = named.length > 0 ? named.map((option) => settingLabels(option).label) : Object.entries(config).map(([key, value]) => `${key}: ${String(value)}`);
    items.push({ label: translate('automations/facts/settings'), value: lines(shown) });
  }
  return items;
}

/** The Schedule section: when it runs, what happens to missed runs, when it turns off, and the next run. */
function scheduleFacts(entry: AutomationEntry): DetailItem[] {
  const { definition } = entry;
  const schedules = definition.triggers.filter((trigger) => 'schedule' in trigger);
  const onces = definition.triggers.map(oneTimeOf).filter((one) => one !== undefined);
  // An event trigger is one that is neither a schedule nor a one-time trigger, which has no `events`.
  const events = definition.triggers.filter((trigger) => !('schedule' in trigger) && oneTimeOf(trigger) === undefined);
  const ran = typeof (definition._meta?.['ahpd'] as { oneTimeRun?: unknown } | undefined)?.oneTimeRun === 'string';
  const stops = (definition.disableConditions ?? []).map((one) => ('max' in one ? plural('automations/facts/afterRuns', one.max) : translate('automations/facts/afterDate', { date: timeOf(one.date) })));
  const items: DetailItem[] = [];
  for (const trigger of schedules) {
    if (!('schedule' in trigger)) continue;
    items.push({ label: translate('automations/facts/schedule'), value: lines([cronWords(trigger.schedule.expression), <span key="raw" className="web-method">{`${trigger.schedule.expression} \u{00B7} ${trigger.schedule.timeZone}`}</span>]) });
    items.push({ label: translate('automations/facts/missedRuns'), value: translate(String(trigger.misfirePolicy) === 'runOnce' ? 'automations/facts/runOnce' : 'automations/facts/skipped') });
  }
  for (const once of onces) {
    items.push({ label: translate('automations/facts/schedule'), value: translate('automations/onceAt', { time: timeOf(once.runAt) }) });
    items.push({ label: translate('automations/facts/missedRuns'), value: translate(String(once.misfirePolicy) === 'runOnce' ? 'automations/facts/runOnce' : 'automations/facts/skipped') });
  }
  if (schedules.length === 0 && onces.length === 0 && events.length === 0) items.push({ label: translate('automations/facts/schedule'), value: translate('automations/facts/byHandOnly') });
  for (const trigger of events) {
    if ('schedule' in trigger) continue;
    items.push({ label: translate('automations/facts/event'), value: `${trigger.title}${trigger.events.length === 0 ? '' : `: ${trigger.events.map((one) => one.title).join(', ')}`}` });
  }
  if (onces.length === 0) items.push({ label: translate('automations/facts/turnsOff'), value: stops.length === 0 ? <span className="web-note">{translate('automations/facts/never')}</span> : lines(stops) });
  const target = targetOf(definition as Parameters<typeof targetOf>[0]);
  if (target.kind !== 'newSession') items.push({ label: translate('automations/facts/eachRun'), value: translate(`automations/edit/targets/${target.kind}`) });
  if (onces.length > 0) {
    items.push({
      label: translate('automations/facts/nextRun'),
      value: ran ? <span className="web-note">{translate('automations/facts/ran')}</span> : entry.nextRunAt === undefined ? '' : timeOf(entry.nextRunAt),
    });
  }
  if (schedules.length > 0) {
    items.push({
      label: translate('automations/facts/nextRun'),
      value: !definition.enabled ? <span className="web-note">{translate('automations/state/off')}</span> : entry.nextRunAt === undefined ? '' : timeOf(entry.nextRunAt),
    });
  }
  return items;
}

/** The Details section: when it was made and changed, and its customizations. */
function detailFacts(entry: AutomationEntry): DetailItem[] {
  return [
    { label: translate('automations/facts/created'), value: timeOf(entry.createdAt) },
    { label: translate('automations/facts/changed'), value: timeOf(entry.modifiedAt) },
    ...((entry.customizations?.length ?? 0) > 0 ? [{ label: translate('automations/facts/customizations'), value: String(entry.customizations?.length) }] : []),
  ];
}

/** The Overview tab: the agent, the schedule, the instructions, the runs and the details, each a section. */
function Overview({ host, entry, onFailure }: { host: string; entry: AutomationEntry; onFailure: (caught: unknown) => void }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const caps = useStore<AutomationCapabilities | null>(ahpPaths(host).automationCaps);
  const agents = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const iconSrcOf = useAgentIconSrc(useMemo(() => [host], [host]));
  const session = entry.definition.session;
  const provider = session.provider ?? '';
  const settings = useSessionSettings(host, provider, folderLabel(session.workingDirectories?.[0] ?? ''), session.config ?? {});
  const agent = agents.find((one) => one.provider === provider);
  const words: AgentWords = {
    name: agent?.displayName ?? (provider === '' ? t('automations/defaults/host') : provider),
    image: provider === '' ? undefined : iconSrcOf(host, provider),
    models: (settings.models ?? agent?.models ?? []).map((one) => one.id),
    options: settings.options,
  };
  const runs = runsByTime(entry);
  return (
    <div className="web-automation__overview">
      <Section icon={EMOJIcon.agents} title={t('automations/page/sections/agent')} />
      <DetailList items={agentFacts(host, entry, words)} columns={2} />

      <Section icon={EMOJIcon.automations} title={t('automations/page/sections/schedule')} />
      <DetailList items={scheduleFacts(entry)} columns={2} />

      <Section icon={EMOJIcon.markdown} title={t('automations/page/instructions')} />
      <div className="web-automation__message"><Markdown text={entry.definition.message.text} /></div>

      <Section icon={EMOJIcon.run} title={t('automations/page/runs')} count={entry.runCount ?? entry.runs.length} />
      {runs.length === 0 ? <p className="web-note">{t('automations/page/noRuns')}</p> : (
        <table className="web-runs">
          <thead>
            <tr>
              <th>{t('automations/page/columns/status')}</th>
              <th>{t('automations/page/columns/how')}</th>
              <th>{t('automations/page/columns/started')}</th>
              <th>{t('automations/page/columns/took')}</th>
              <th>{t('automations/page/columns/tokens')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => {
              const facts = runFacts(run);
              const tone = RUN[facts.status];
              const shown = tone === undefined ? { tone: 'default' as Tone, text: facts.status } : { tone, text: t(`automations/run/${facts.status}`) };
              const live = facts.status === 'running' || facts.status === 'pending';
              return (
                <tr key={run.resource}>
                  <td><Badge tone={shown.tone} text={shown.text} />{facts.error === undefined ? null : <div className="web-note">{facts.error}</div>}</td>
                  <td>{originOf(run.origin)}</td>
                  <td>{timeOf(facts.at)}</td>
                  <td>{facts.took === undefined ? '' : elapsed(facts.took)}</td>
                  <td>{facts.input === undefined && facts.output === undefined ? '' : `\u{2191}${tokens(facts.input ?? 0)} \u{2193}${tokens(facts.output ?? 0)}`}</td>
                  <td className="web-runs__actions">
                    {run.primarySession === undefined ? null : (
                      <Button label={t('automations/page/openSession')} size="sm" onClick={() => void scena.commands.execute('ahp.openSession', { host, resource: run.primarySession })} />
                    )}
                    {live && caps?.runCancellation !== undefined ? <Button label={t('automations/page/stop')} size="sm" onClick={() => cancelRun(host, run.resource)} /> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {entry.runsNextCursor === undefined ? null : (
        <Button
          label={t('automations/page/loadOlder')}
          onClick={() => void hostBridge(host).request('fetchAutomationRuns', { channel: AUTOMATIONS, automation: entry.resource, cursor: entry.runsNextCursor } as never).catch(onFailure)}
        />
      )}

      <Section icon={EMOJIcon.info} title={t('automations/page/sections/details')} />
      <DetailList items={detailFacts(entry)} columns={2} />
    </div>
  );
}

/** One automation: its head with its state, Run now and Turn on or off, over Overview and Settings, with Delete at the end of Settings. */
export default function AutomationPage({ host, resource }: { host: string; resource?: string }): ReactElement {
  const { t } = useI18n();
  const { state, error } = useChannel<Catalogue>(host, AUTOMATIONS, automationReducer);
  const ask = useStore<AutomationAsk>(AUTOMATION_SECTION);
  const [failure, setFailure] = useState<string | null>(null);
  if (error !== null) return <PageAlert tone="danger" title={t('automations/notices/none')} message={error} />;
  if (state === undefined) return <PageSpinner label={t('automations/notices/reading')} />;
  const entry = state.entries.find((one) => one.resource === resource);
  if (entry === undefined) return <PageAlert tone="warning" message={t('automations/notices/gone')} />;

  const can = (operation: string): boolean => entry.operations.map(String).includes(operation);
  const now = stateOf(entry);
  const say = (caught: unknown): void => setFailure(caught instanceof Error ? caught.message : String(caught));
  const overview = <Overview host={host} entry={entry} onFailure={say} />;
  const settings = can('update') || can('remove');

  return (
    <div className="web-page web-automation">
      <div className="web-page__head">
        <PageTitle emoji={EMOJIcon.automations} title={titleOf(entry)} uri={entry.resource} state={<Badge tone={STATE[now]} text={t(`automations/state/${now}`)} />} />
        <div className="web-page__actions">
          {can('run') ? <Button label={t('automations/actions/runNow')} variant="primary" onClick={() => void runNow(host, entry).catch(say)} /> : null}
          {can('update') ? <Button label={t(entry.definition.enabled ? 'automations/actions/turnOff' : 'automations/actions/turnOn')} onClick={() => setEnabled(host, entry, !entry.definition.enabled)} /> : null}
        </div>
      </div>
      {failure === null ? null : <Alert tone="danger" message={failure} />}
      {!settings ? overview : (
        <KeptTabs
          key={ask?.host === host && ask.resource === entry.resource ? ask.at : 0}
          tabs={[
            { key: 'overview', title: t('automations/page/overview'), child: overview },
            { key: 'settings', title: t('automations/page/settings'), child: (
              <>
                {/* Shown read-only where the host refuses an update, so the fields still say what it does. */}
                <AutomationForm host={host} entry={entry} />
                {can('remove') ? <DangerZone label={t('automations/actions/delete')} onClick={() => void remove(host, entry)} /> : null}
              </>
            ) },
          ]}
          defaultValue={automationTabKey()}
          onChange={keepAutomationTabKey}
        />
      )}
    </div>
  );
}
