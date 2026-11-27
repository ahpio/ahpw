import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import { getLocale } from '@softov/scena';
import { useI18n, useScena, useStore } from '@softov/scena/react';
import { Blocks, Button, CheckBox, ChoicePicker, ContextMenu, FormRow, Note, Page, PageActions, Section, Text, TextField } from '../../ui/index.js';
import {
  automationReducer,
  type AgentInfo,
  type AutomationCapabilities,
  type AutomationEntry,
  type AutomationState as Catalogue,
  type SessionSummary,
  type StateAction,
} from '@microsoft/agent-host-protocol';
import { ahpPaths, AUTOMATIONS, hostBridge } from '../../bridges/data.js';
import { HOST_LIST, type HostName } from '../../bridges/hosts.js';
import { embedMode } from '../../shell/embed/index.js';
import { writeLastHost } from '../sessions/last-host.js';
import { useChannel } from '../../bridges/channel.js';
import { folderLabel, newId } from '../../bridges/words.js';
import { cronWords, definitionOf, draftOf, draftProblem, localInput, localZone, type Draft } from './words.js';
import { oneTimeOf, type NextCapabilities } from './next.js';
import { PageAlert } from '../../ui/display/PageAlert.js';
import { plural } from '../../i18n/locales.js';
import { EMOJIcon } from '../emojis.js';
import { confirm } from '../../shell/notify/confirm.js';
import { templatesIn, type AutomationTemplate } from './templates.js';
import { NEW_AUTOMATION_TAB } from './state.js';
import { SettingsBox } from './SettingsBox.js';
import { useSessionSettings } from './session-settings.js';
import { PageSpinner } from '../../ui/display/PageSpinner.js';
import './edit.css';

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
  const caps = useStore<AutomationCapabilities | null>(ahpPaths(host).automationCaps) as NextCapabilities | null;
  const home = useStore<string | null>(ahpPaths(host).defaultDirectory);
  const sessions = useStore<SessionSummary[]>(ahpPaths(host).sessions) ?? [];
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
  // A host that refuses an update, as after a one-time trigger ran, leaves the form to be read.
  const locked = entry !== undefined && !entry.operations.includes('update' as never);
  const ranOnce = entry?.definition.triggers.some((trigger) => oneTimeOf(trigger) !== undefined) === true;
  // The run targets this host offers, and the one the automation already has.
  const targets = caps?.targets === undefined ? [] : [
    'newSession',
    ...(caps.targets.previousSession === undefined && shown.target !== 'previousSession' ? [] : ['previousSession']),
    ...(caps.targets.chat === undefined && shown.target !== 'chat' ? [] : ['chat']),
  ] as Draft['target'][];
  // Each session's chats, named `session › chat`, for a chat target.
  const chats = sessions.flatMap((one) => (one.chats ?? []).map((chat) => ({
    chat: chat.resource,
    session: one.resource,
    label: chat.title === '' || chat.title === one.title ? one.title : `${one.title} › ${chat.title}`,
  })));
  // Tomorrow at 09:00, which is what a person most often means by "once".
  const tomorrow = (): string => { const at = new Date(); at.setDate(at.getDate() + 1); at.setHours(9, 0, 0, 0); return localInput(at.toISOString()); };

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
    <Blocks>
      {header}

      {entry === undefined ? (
        <ExamplesButton
          dirty={shown.title.trim() !== '' || shown.message.trim() !== '' || shown.expression.trim() !== ''}
          onPick={(template) => set({ title: template.title, message: template.prompt, expression: template.expression })}
        />
      ) : null}

      <fieldset className="web-automation-form__fields" disabled={locked}>
      <TextField label={t('automations/edit/title')} value={shown.title} onChange={(next) => set({ title: next })} />

      <Section icon={EMOJIcon.markdown} title={t('automations/page/instructions')} />
      <SettingsBox host={host} agents={agents} draft={shown} settings={settings} set={set} />

      <Section icon={EMOJIcon.automations} title={t('automations/page/sections/schedule')} />
      <FormRow>
        <ChoicePicker
          label={t('automations/edit/schedule')}
          options={[
            ...PRESETS.map((one) => ({ value: one.expression, label: t(`automations/edit/presets/${one.key}`) })),
            ...(caps?.oneTime === undefined && !shown.once ? [] : [{ value: 'once', label: t('automations/edit/presets/once') }]),
            { value: 'custom', label: t('automations/edit/custom') },
          ]}
          value={shown.once ? 'once' : preset?.expression ?? 'custom'}
          onChange={(value) => {
            if (value === 'once') set({ once: true, runAt: shown.runAt === '' ? tomorrow() : shown.runAt });
            else if (value !== 'custom') set({ once: false, expression: value });
            else set({ once: false });
          }}
        />
        {shown.once ? (
          <TextField label={t('automations/edit/runAt')} hint={t('automations/edit/runAtHint', { zone: localZone() })} type="datetime-local" value={shown.runAt} onChange={(next) => set({ runAt: next })} />
        ) : (
          <TextField
            label={t('automations/edit/cron')}
            hint={`${shown.expression.trim() === '' ? t('automations/edit/byHandHint') : cronWords(shown.expression)}${minimum === undefined ? '' : ` ${plural('automations/edit/minimum', minimum)}`}`}
            value={shown.expression}
            placeholder={t('automations/edit/cronPlaceholder')}
            onChange={(next) => set({ expression: next })}
          />
        )}
      </FormRow>

      {shown.once ? (
        <FormRow>
          <ChoicePicker
            label={t('automations/edit/missedRuns')}
            hint={t('automations/edit/missedHint')}
            options={[{ value: 'skip', label: t('automations/edit/skip') }, { value: 'runOnce', label: t('automations/edit/runOnce') }]}
            value={shown.misfire}
            onChange={(next) => set({ misfire: next === 'runOnce' ? 'runOnce' : 'skip' })}
          />
        </FormRow>
      ) : shown.expression.trim() === '' ? null : (
        <FormRow>
          <TextField label={t('automations/edit/timeZone')} value={shown.timeZone} onChange={(next) => set({ timeZone: next })} />
          <ChoicePicker
            label={t('automations/edit/missedRuns')}
            hint={t('automations/edit/missedHint')}
            options={[{ value: 'skip', label: t('automations/edit/skip') }, { value: 'runOnce', label: t('automations/edit/runOnce') }]}
            value={shown.misfire}
            onChange={(next) => set({ misfire: next === 'runOnce' ? 'runOnce' : 'skip' })}
          />
        </FormRow>
      )}

      {shown.once ? null : (
      <FormRow>
        <TextField label={t('automations/edit/afterRuns')} hint={t('automations/edit/keepsOn')} type="number" min={1} step={1} value={shown.afterRuns} onChange={(next) => set({ afterRuns: next })} />
        <TextField label={t('automations/edit/afterDate')} hint={t('automations/edit/keepsOn')} type="date" value={shown.afterDate} onChange={(next) => set({ afterDate: next })} />
      </FormRow>
      )}

      {targets.length === 0 ? null : (
        <>
          <Section icon={EMOJIcon.forward} title={t('automations/page/sections/target')} />
          <FormRow>
            <ChoicePicker label={t('automations/edit/eachRun')} hint={t(`automations/edit/targets/${shown.target}Hint`)} options={targets.map((one) => ({ value: one, label: t(`automations/edit/targets/${one}`) }))} value={shown.target} onChange={(next) => set({ target: next as Draft['target'] })} />
            {shown.target !== 'chat' ? null : (
              <ChoicePicker
                label={t('automations/edit/chat')}
                options={[
                  { value: '', label: '', disabled: true },
                  ...chats.map((one) => ({ value: one.chat, label: one.label })),
                  ...(shown.chat === '' || chats.some((one) => one.chat === shown.chat) ? [] : [{ value: shown.chat, label: shown.chat }]),
                ]}
                value={shown.chat}
                onChange={(next) => {
                  const picked = chats.find((one) => one.chat === next);
                  set({ chat: next, chatSession: picked?.session ?? '' });
                }}
              />
            )}
          </FormRow>
        </>
      )}
      </fieldset>

      {entry === undefined ? (
        <CheckBox label={t('automations/edit/on')} value={shown.enabled} onChange={(next) => set({ enabled: next })} />
      ) : null}

      {locked ? <Note>{t(ranOnce ? 'automations/edit/locked' : 'automations/edit/lockedOther')}</Note> : null}
      {problem === undefined || locked ? null : <Note>{problem}</Note>}
      {entry === undefined ? (
        <PageActions>
          <Button label={t('automations/edit/create')} variant="primary" disabled={problem !== undefined} onClick={save} />
          <Button label={t('automations/edit/cancel')} onClick={() => scena.surfaces.close(NEW_AUTOMATION_TAB)} />
        </PageActions>
      ) : (
        <PageActions>
          <Button label={t('automations/edit/save')} variant="primary" disabled={problem !== undefined || !dirty} onClick={save} />
          <Button label={t('automations/edit/reset')} disabled={!dirty} onClick={() => { setDraft(null); setSaved(false); }} />
          {saved && !dirty ? <Note inline>{t('automations/edit/saved')}</Note> : null}
        </PageActions>
      )}
    </Blocks>
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
    <Page>
      <AutomationForm
        key={host}
        host={host}
        header={(
          <>
            <Text variant="h2" text={t('automations/commands/new')} />
            {embedMode() === 'multi' ? (
              <ChoicePicker label={t('automations/edit/host')} options={(hostList ?? []).map((one) => ({ value: one.id, label: one.name }))} value={host} onChange={(next) => { setPicked(next); writeLastHost(next); }} />
            ) : null}
          </>
        )}
      />
    </Page>
  );
}
