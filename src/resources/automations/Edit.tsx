import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Button, ContextMenu, Text } from '@softov/scena/ui';
import {
  automationReducer,
  type AgentInfo,
  type AutomationCapabilities,
  type AutomationEntry,
  type AutomationState as Catalogue,
  type StateAction,
} from '@microsoft/agent-host-protocol';
import { ahpPaths, AUTOMATIONS, hostBridge } from '../../bridges/data.js';
import { HOST_LIST, type HostName } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { writeLastHost } from '../sessions/last-host.js';
import { useChannel } from '../../bridges/channel.js';
import { folderLabel, newId } from '../../bridges/words.js';
import { cronWords, definitionOf, draftOf, draftProblem, type Draft } from './words.js';
import { PageAlert } from '../../shell/view/PageAlert.js';
import { Field } from '../../shell/view/Field.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { confirm } from '../../shell/notify/confirm.js';
import { templatesIn, type AutomationTemplate } from './templates.js';
import { NEW_AUTOMATION_TAB } from './state.js';
import { SettingsBox } from './SettingsBox.js';
import { useSessionSettings } from './session-settings.js';
import { Section } from '../../shell/view/Section.js';
import { PageSpinner } from '../../shell/view/PageSpinner.js';

/** Schedules most people want, so a cron expression is something to read rather than write. */
const PRESETS: { key: string; expression: string }[] = [
  { key: 'byHand', expression: '' },
  { key: 'every10Minutes', expression: '*/10 * * * *' },
  { key: 'everyHour', expression: '0 * * * *' },
  { key: 'every6Hours', expression: '0 */6 * * *' },
  { key: 'dailyAt9', expression: '0 9 * * *' },
  { key: 'weekdaysAt9', expression: '0 9 * * 1-5' },
  { key: 'mondayAt5', expression: '0 5 * * 1' },
];

/** A button that lists the examples and hands back the one picked, asking first when it would replace what was typed. */
function ExamplesButton({ dirty, onPick }: { dirty: boolean; onPick: (template: AutomationTemplate) => void }): ReactElement {
  const { t } = useI18n();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const anchor = useRef<HTMLDivElement>(null);
  const take = (template: AutomationTemplate) => (list: { closeMenu: () => void }): void => {
    list.closeMenu();
    if (!dirty) {
      onPick(template);
      return;
    }
    void confirm({ title: t('automations/edit/examples/replace'), body: t('automations/edit/examples/replaceNote'), confirmLabel: t('automations/edit/examples/replaceYes'), cancelLabel: t('automations/edit/examples/replaceNo') })
      .then((yes) => { if (yes) onPick(template); });
  };
  // The menu sits inside the anchor: a page's own children take its gutter as a margin.
  return (
    <div ref={anchor}>
      <Button
        label={`${t('automations/edit/examples/open')} ${EMOJIcon.caretDown}`}
        onClick={() => {
          const box = anchor.current?.getBoundingClientRect();
          if (box !== undefined) setMenu({ x: box.left, y: box.bottom });
        }}
      />
      {menu === null ? null : (
        <ContextMenu
          spec={{
            rich: true,
            items: templatesIn(getLocale()).map((one) => ({
              title: one.title,
              description: cronWords(one.expression),
              icon: one.emoji,
              group: t(`automations/edit/examples/${one.group}`),
              onSelect: take(one),
            })),
          }}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
        />
      )}
    </div>
  );
}

/** The fields of an automation and their buttons: Create and Cancel for a new one, Save and Reset for one that exists. */
export function AutomationForm({ host, entry, header }: { host: string; entry?: AutomationEntry | undefined; header?: ReactNode }): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const agents = useStore<AgentInfo[]>(ahpPaths(host).agents) ?? [];
  const caps = useStore<AutomationCapabilities | null>(ahpPaths(host).automationCaps);
  const home = useStore<string | null>(ahpPaths(host).defaultDirectory);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saved, setSaved] = useState(false);

  const held = draftOf(entry, { ...(agents[0] === undefined ? {} : { provider: agents[0].provider }), ...(home === null || home === undefined ? {} : { folder: folderLabel(home) }) });
  // Turn on and Turn off sit in the page's head, so a made automation's form keeps the state the host holds.
  const shown = entry === undefined ? draft ?? held : { ...(draft ?? held), enabled: held.enabled };
  const dirty = JSON.stringify(shown) !== JSON.stringify(held);
  const set = (patch: Partial<Draft>): void => { setDraft({ ...shown, ...patch }); setSaved(false); };
  const settings = useSessionSettings(host, shown.provider, shown.folder, shown.config);
  const problem = draftProblem(shown);
  const minimum = caps?.schedules?.minIntervalMinutes;
  const preset = PRESETS.find((one) => one.expression === shown.expression.trim());

  const save = (): void => {
    if (problem !== undefined) return;
    const definition = definitionOf(shown, entry?.definition);
    if (entry === undefined) {
      const created = `ahp-automation:/${newId()}`;
      hostBridge(host).dispatch(AUTOMATIONS, { type: 'automation/createRequested', resource: created, definition } as StateAction);
      scena.surfaces.close(NEW_AUTOMATION_TAB);
      writeLastHost(host);
      void scena.commands.execute('ahp.openAutomation', { host, resource: created });
    } else {
      hostBridge(host).dispatch(AUTOMATIONS, { type: 'automation/updateRequested', resource: entry.resource, changes: definition } as StateAction);
      setSaved(true);
    }
  };

  return (
    <div className="web-automation-form">
      {header}

      {entry === undefined ? (
        <ExamplesButton
          dirty={shown.title.trim() !== '' || shown.message.trim() !== '' || shown.expression.trim() !== ''}
          onPick={(template) => set({ title: template.title, message: template.prompt, expression: template.expression })}
        />
      ) : null}

      <Field label={t('automations/edit/title')}>
        <input className="web-field" value={shown.title} onChange={(event) => set({ title: event.target.value })} />
      </Field>

      <Section icon={EMOJIcon.markdown} title={t('automations/page/instructions')} />
      <SettingsBox host={host} agents={agents} draft={shown} settings={settings} set={set} />

      <Section icon={EMOJIcon.automations} title={t('automations/page/sections/schedule')} />
      <div className="web-form__row">
        <Field label={t('automations/edit/schedule')}>
          <select className="web-field" value={preset?.expression ?? 'custom'} onChange={(event) => { if (event.target.value !== 'custom') set({ expression: event.target.value }); }}>
            {PRESETS.map((one) => <option key={one.key} value={one.expression}>{t(`automations/edit/presets/${one.key}`)}</option>)}
            <option value="custom">{t('automations/edit/custom')}</option>
          </select>
        </Field>
        <Field
          label={t('automations/edit/cron')}
          hint={`${shown.expression.trim() === '' ? t('automations/edit/byHandHint') : cronWords(shown.expression)}${minimum === undefined ? '' : ` ${plural('automations/edit/minimum', minimum)}`}`}
        >
          <input className="web-field" value={shown.expression} placeholder={t('automations/edit/cronPlaceholder')} onChange={(event) => set({ expression: event.target.value })} />
        </Field>
      </div>

      {shown.expression.trim() === '' ? null : (
        <div className="web-form__row">
          <Field label={t('automations/edit/timeZone')}>
            <input className="web-field" value={shown.timeZone} onChange={(event) => set({ timeZone: event.target.value })} />
          </Field>
          <Field label={t('automations/edit/missedRuns')} hint={t('automations/edit/missedHint')}>
            <select className="web-field" value={shown.misfire} onChange={(event) => set({ misfire: event.target.value === 'runOnce' ? 'runOnce' : 'skip' })}>
              <option value="skip">{t('automations/edit/skip')}</option>
              <option value="runOnce">{t('automations/edit/runOnce')}</option>
            </select>
          </Field>
        </div>
      )}

      <div className="web-form__row">
        <Field label={t('automations/edit/afterRuns')} hint={t('automations/edit/keepsOn')}>
          <input className="web-field" type="number" min={1} step={1} value={shown.afterRuns} onChange={(event) => set({ afterRuns: event.target.value })} />
        </Field>
        <Field label={t('automations/edit/afterDate')} hint={t('automations/edit/keepsOn')}>
          <input className="web-field" type="date" value={shown.afterDate} onChange={(event) => set({ afterDate: event.target.value })} />
        </Field>
      </div>

      {entry === undefined ? (
        <label className="web-input__row">
          <input type="checkbox" checked={shown.enabled} onChange={(event) => set({ enabled: event.target.checked })} />
          <span>{t('automations/edit/on')}</span>
        </label>
      ) : null}

      {problem === undefined ? null : <p className="web-note">{problem}</p>}
      {entry === undefined ? (
        <div className="web-page__actions">
          <Button label={t('automations/edit/create')} variant="primary" disabled={problem !== undefined} onClick={save} />
          <Button label={t('automations/edit/cancel')} onClick={() => scena.surfaces.close(NEW_AUTOMATION_TAB)} />
        </div>
      ) : (
        <div className="web-page__actions">
          <Button label={t('automations/edit/save')} variant="primary" disabled={problem !== undefined || !dirty} onClick={save} />
          <Button label={t('automations/edit/reset')} disabled={!dirty} onClick={() => { setDraft(null); setSaved(false); }} />
          {saved && !dirty ? <span className="web-note">{t('automations/edit/saved')}</span> : null}
        </div>
      )}
    </div>
  );
}

/** The form for a new automation; with every host, it starts on the last host used and may move to another. */
export default function NewAutomationPage({ host: opened }: { host: string }): ReactElement {
  const [picked, setPicked] = useState(opened);
  const host = embedMode() === 'multi' ? picked : opened;
  const hostList = useStore<HostName[]>(HOST_LIST);
  const { t } = useI18n();
  const { state, error } = useChannel<Catalogue>(host, AUTOMATIONS, automationReducer);
  const caps = useStore<AutomationCapabilities | null>(ahpPaths(host).automationCaps);

  if (error !== null) return <PageAlert tone="danger" title={t('automations/notices/none')} message={error} />;
  if (state === undefined) return <PageSpinner label={t('automations/notices/reading')} />;
  if (caps?.create === undefined) return <PageAlert tone="warning" message={t('automations/edit/noCreate')} />;

  return (
    <div className="web-page">
      <AutomationForm
        key={host}
        host={host}
        header={(
          <>
            <Text variant="h2" text={t('automations/commands/new')} />
            {embedMode() === 'multi' ? (
              <Field label={t('automations/edit/host')}>
                <select className="web-field" value={host} onChange={(event) => { setPicked(event.target.value); writeLastHost(event.target.value); }}>
                  {(hostList ?? []).map((one) => <option key={one.id} value={one.id}>{one.name}</option>)}
                </select>
              </Field>
            ) : null}
          </>
        )}
      />
    </div>
  );
}
