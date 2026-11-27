import { useMemo, useState, type ReactElement } from 'react';
import { useI18n, useScena } from '@softov/scena/react';
import type { AgentInfo } from '@microsoft/agent-host-protocol';
import { ahpPaths } from '../../bridges/data.js';
import { folderLabel } from '../../bridges/words.js';
import { useAgentIconSrc } from '../agents/icons.js';
import { EMOJIcon } from '../emojis.js';
import { askFolder } from '../folders/pick.js';
import { optionLabel, pickable, showsPill, type ModelChoice, type Option } from '../sessions/composer-commands.js';
import { customAgents } from '../sessions/custom-agents.js';
import { footerSide } from '../sessions/footer.js';
import { readTrayOpen, writeTrayOpen } from '../sessions/new-tray.js';
import { isApprovals, modelLabels, settingLabels } from '../sessions/pill-labels.js';
import { Button, MessageBox, MessageText, Note, Pill, TextPill } from '../../ui/index.js';
import { whereLabel, wheresOf } from '../sessions/where.js';
import { MenuPill, type PillChoice } from './MenuPill.js';
import type { SessionSettings } from './session-settings.js';
import type { Draft } from './words.js';
import '../sessions/composer.css';
import './settings-box.css';
import '../sessions/new.css';

/** The choices of a setting that is a list or a switch. */
function settingChoices(option: Option, pick: (value: unknown) => void, words: { on: string; off: string }): PillChoice[] {
  const { schema, value } = option;
  const current = value ?? schema.default;
  if (schema.type === 'boolean') {
    return [true, false].map((one) => ({ title: one ? words.on : words.off, active: current === one, pick: () => pick(one) }));
  }
  return (schema.enum ?? []).map((one, index) => ({
    title: schema.enumLabels?.[index] ?? String(one),
    ...(schema.enumDescriptions?.[index] === undefined ? {} : { description: schema.enumDescriptions[index] }),
    active: current === one,
    pick: () => pick(one),
  }));
}

/**
 * The session each run starts, drawn as the new session box draws it: the
 * folder, the settings and the agent over the instructions, and the custom
 * agent, the approvals and the model under them. Each pill opens its list.
 */
export function SettingsBox({ host, agents, draft, settings, set }: {
  host: string;
  agents: readonly AgentInfo[];
  draft: Draft;
  settings: SessionSettings;
  set: (patch: Partial<Draft>) => void;
}): ReactElement {
  const scena = useScena();
  const { t } = useI18n();
  const iconSrcOf = useAgentIconSrc(useMemo(() => [host], [host]));
  const [trayOpen, setTrayOpen] = useState(readTrayOpen);
  const fold = (open: boolean): void => {
    setTrayOpen(open);
    writeTrayOpen(open);
  };

  const agent = agents.find((one) => one.provider === draft.provider);
  const agentName = agent?.displayName ?? (draft.provider === '' ? t('automations/defaults/host') : draft.provider);
  const custom = customAgents(agent?.customizations);
  const models: ModelChoice[] = settings.models ?? (agent?.models ?? []).map((one) => ({ id: one.id, name: one.name }));
  // A model the agent does not offer stays in the draft, so the pill says so instead of showing the default.
  // Before the agent's list is known, nothing is said against the model.
  const offered = draft.model === '' || models.length === 0 || models.some((one) => one.id === draft.model);
  const modelName = draft.model === '' ? t('automations/defaults/agent') : models.find((one) => one.id === draft.model)?.name ?? draft.model;
  const folderName = draft.folder.replace(/[\\/]+$/, '').split(/[\\/]/).pop() ?? '';
  const onOff = { on: t('sessions/values/on'), off: t('sessions/values/off') };

  const setOption = (key: string) => (value: unknown): void => set({ config: { ...draft.config, [key]: value } });
  const settingPill = (option: Option): ReactElement | null => {
    const { key, schema, value } = option;
    const described = schema.description === undefined ? {} : { title: schema.description };
    if (pickable(schema)) {
      const labels = settingLabels(option);
      return <MenuPill key={key} label={labels.label} short={labels.short} icon={labels.icon} {...described} choices={() => settingChoices(option, setOption(key), onOff)} />;
    }
    if (schema.type === 'string' || schema.type === 'number') {
      const current = value ?? schema.default;
      return (
        <TextPill
          key={key}
          label={schema.title || key}
          {...described}
          value={current === undefined || current === null ? '' : String(current)}
          onChange={(next) => setOption(key)(schema.type === 'string' ? next : next === '' ? undefined : Number(next))}
        />
      );
    }
    return showsPill(option) ? <Pill key={key} label={t('sessions/pills/setting', { name: schema.title || key, value: optionLabel(option) })} {...described} /> : null;
  };

  const folderChoices = (): PillChoice[] => {
    const home = scena.store.get<string | null>(ahpPaths(host).defaultDirectory) ?? null;
    const homePath = home === null ? null : folderLabel(home).replace(/\/+$/, '');
    const browse = (): void => {
      void askFolder({ host, title: t('sessions/new/where'), start: homePath === null ? '/' : `${homePath}/`, home: homePath })
        .then((path) => { if (path !== null) set({ folder: path.replace(/[\\/]+$/, '') || path }); });
    };
    return [
      ...wheresOf(scena.store, [host]).map((one): PillChoice => ({
        title: whereLabel(one.path, null),
        description: one.path,
        icon: EMOJIcon.folder,
        group: t('sessions/new/recent'),
        active: one.path === draft.folder.replace(/[\\/]+$/, ''),
        pick: () => set({ folder: one.path }),
      })),
      { title: t('sessions/new/openFolder'), icon: EMOJIcon.open, group: t('sessions/new/browse'), pick: browse },
    ];
  };

  const agentChoices = (): PillChoice[] => agents.map((one): PillChoice => {
    const iconSrc = iconSrcOf(host, one.provider);
    // Another agent has its own models, custom agents and settings, so those start again from its defaults.
    return { title: one.displayName, ...(iconSrc === undefined ? {} : { iconSrc }), active: one.provider === draft.provider, pick: () => set({ provider: one.provider, model: '', agent: '', config: {} }) };
  });

  const customChoices = (): PillChoice[] => [
    { title: t('sessions/commands/agent'), active: draft.agent === '', pick: () => set({ agent: '' }) },
    ...custom.map((one): PillChoice => ({ title: one.name, ...(one.description === undefined ? {} : { description: one.description }), active: one.uri === draft.agent, pick: () => set({ agent: one.uri }) })),
  ];

  const modelChoices = (): PillChoice[] => [
    { title: t('automations/defaults/agent'), active: draft.model === '', pick: () => set({ model: '' }) },
    ...(offered ? [] : [{ title: draft.model, description: t('automations/edit/notOffered'), active: true, pick: () => undefined }]),
    ...models.map((one): PillChoice => ({ title: one.name, active: one.id === draft.model, pick: () => set({ model: one.id }) })),
  ];

  const model = modelLabels(modelName);
  return (
    <div className="web-composer web-automation__box">
      {trayOpen ? (
        <div className="web-composer__where web-new__tray">
          <MenuPill label={draft.folder.trim() === '' ? t('sessions/new/where') : whereLabel(draft.folder, null)} lead={<span aria-hidden="true">{EMOJIcon.folder}</span>} title={t('sessions/new/whereHint')} choices={folderChoices} />
          {settings.options.filter((option) => footerSide(option) === 'left' && !isApprovals(option)).map(settingPill)}
          {settings.reading && draft.provider !== '' ? <Pill label={t('sessions/new/readingSettings')} /> : null}
          <MenuPill label={agentName} image={iconSrcOf(host, draft.provider)} title={t('sessions/new/harnessHint')} choices={agentChoices} />
          <Button variant="quiet" size="xs" expanded={true} ariaLabel={t('sessions/new/fold')} title={t('sessions/new/fold')} onClick={() => fold(false)}>
            {'<'}
          </Button>
        </div>
      ) : (
        <div className="web-composer__where web-new__tray">
          <Pill label={`${agentName}${folderName === '' ? '' : ` · ${folderName}`}`} title={t('sessions/new/unfold')} expanded={false} onClick={() => fold(true)} />
          <Button variant="quiet" size="xs" expanded={false} ariaLabel={t('sessions/new/unfold')} title={t('sessions/new/unfold')} onClick={() => fold(true)}>
            {'>'}
          </Button>
        </div>
      )}
      <MessageBox
        left={(
          <>
            {custom.length === 0 ? null : (
              <MenuPill label={custom.find((one) => one.uri === draft.agent)?.name ?? t('sessions/commands/agent')} title={t('sessions/commands/agentHint')} choices={customChoices} />
            )}
            {settings.options.filter((option) => footerSide(option) === 'left' && isApprovals(option)).map(settingPill)}
          </>
        )}
        right={(
          <>
            <MenuPill
              label={offered ? model.label : t('automations/edit/notOfferedPill', { model: draft.model })}
              short={offered ? model.short : t('automations/edit/notOfferedPill', { model: draft.model })}
              icon={model.icon}
              {...(offered ? {} : { lead: <span className="web-automation__warn" aria-hidden="true">{EMOJIcon.warning}</span> })}
              title={t('automations/edit/modelHint')}
              choices={modelChoices}
            />
            {settings.options.filter((option) => footerSide(option) === 'right').map(settingPill)}
          </>
        )}
      >
        <MessageText
          rows={4}
          value={draft.message}
          aria-label={t('automations/page/instructions')}
          placeholder={t('automations/edit/instructionsPlaceholder')}
          onChange={(event) => set({ message: event.currentTarget.value })}
        />
      </MessageBox>
      <Note>{t('automations/edit/messageHint')}</Note>
      {offered ? null : <p className="web-automation__warning">{t('automations/edit/notOfferedNote', { agent: agentName, model: draft.model })}</p>}
    </div>
  );
}
