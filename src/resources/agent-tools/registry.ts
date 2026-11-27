import type { BindingPath, Disposable, Scena } from '@softov/scena/types';
import { combineDisposables, translate } from '@softov/scena';
import { askAt } from './asks.js';
import { chatChoice, type ChatChoice } from '../sessions/view-settings.js';
import type { UiKey, UiSetting } from '../../shell/ui-settings/settings.js';
import type { InputSchema } from './check.js';
import { insecurePage, WITHOUT_HTTPS } from './lock.js';

/** A command that can be served to the agent as a tool. */
export interface ToolMark {
  /** The scena command's id. */
  id: string;
  /** Where it is listed, lowest first. */
  order: number;
  /** What the model reads: one short English sentence. */
  text: string;
  /** What the command takes; read when asked, so a list of choices is the list now. */
  input: () => InputSchema;
}

/** What a call to a marked command does: nothing, wait for a person, run with a toast, or run. */
export const MODES = ['off', 'ask', 'notify', 'run'] as const;
export type Mode = (typeof MODES)[number];

/** The command that opens a call waiting for a person. */
export const SHOW_ASK = 'ahp.agentTools.showAsk';

const PREFIX = 'ahpw.agentTools.';

/** A mark and its mode, which is kept in this browser and off with nothing kept. */
interface Served extends ToolMark {
  choice: ChatChoice;
}

const served = new Map<string, Served>();

/** Marks a command as one the agent can be given. Called where the command's module loads, so every mark is known before the settings are read. */
export function serveAsTool(mark: ToolMark): Disposable {
  const entry: Served = { ...mark, choice: chatChoice(`$/agentTools/modes/${mark.id}` as BindingPath, `${PREFIX}${mark.id}`, MODES, 'off') };
  served.set(mark.id, entry);
  return { dispose: () => { if (served.get(mark.id) === entry) served.delete(mark.id); } };
}

/** Every mark, in order, whatever order their modules loaded in. */
const ordered = (): Served[] => [...served.values()].sort((a, b) => a.order - b.order);

export const marks = (): ToolMark[] => ordered();
export const markOf = (id: string): ToolMark | undefined => served.get(id);

/** A command's mode; off for a command that has no mark. */
export const modeOf = (scena: Scena, id: string): Mode => (served.get(id)?.choice.read(scena.store) ?? 'off') as Mode;

export const setMode = (scena: Scena, id: string, mode: Mode): void => served.get(id)?.choice.set(scena.store, mode);

/** The marks that are on. */
export const marksOn = (scena: Scena): ToolMark[] => marks().filter((mark) => modeOf(scena, mark.id) !== 'off');

/** Every mode as one string, which changes when any of them does. */
export const modesNow = (scena: Scena): string => marks().map((mark) => `${mark.id}=${modeOf(scena, mark.id)}`).join('\n');

/** Calls `changed` whenever any mode changes. */
export function watchModes(scena: Scena, changed: () => void): Disposable {
  const watches = [...served.values()].map((one) => scena.store.subscribe(one.choice.path, changed));
  return { dispose: () => { for (const one of watches) one.dispose(); } };
}

/** Brings a mode changed in another window of this browser into this one, and registers the command that opens a waiting call. */
export function registerAgentTools(scena: Scena): Disposable {
  const heard = (event: StorageEvent): void => {
    if (event.key === null) {
      for (const one of served.values()) scena.store.set(one.choice.path, one.choice.usual);
      return;
    }
    if (!event.key.startsWith(PREFIX)) return;
    const one = served.get(event.key.slice(PREFIX.length));
    if (one !== undefined) scena.store.set(one.choice.path, event.newValue ?? one.choice.usual);
  };
  window.addEventListener('storage', heard);
  return combineDisposables(
    { dispose: () => window.removeEventListener('storage', heard) },
    scena.commands.register({
      id: SHOW_ASK,
      title: SHOW_ASK,
      run: async (_ctx, args) => {
        const { host, resource, key } = args as { host: string; resource: string; key: string };
        await scena.commands.execute('ahp.openSession', { host, resource });
        askAt(key)?.show();
      },
    }),
  );
}

/** A command's title, in the page's language. */
export function commandTitle(scena: Scena, id: string): string {
  const title = scena.commands.get(id)?.title;
  return (typeof title === 'function' ? title() : title) ?? id;
}

/** `ui.agentToolsWithoutHttps`: whether the agent gets the commands on a page with no Web Locks. */
const withoutHttps: UiSetting = {
  key: 'ui.agentToolsWithoutHttps',
  values: () => WITHOUT_HTTPS.values,
  usual: () => WITHOUT_HTTPS.usual,
  title: () => translate('sessions/agentTools/withoutHttps/title'),
  description: () => translate('sessions/agentTools/withoutHttps/description'),
  label: (value) => translate(`sessions/agentTools/withoutHttps/${value}`),
  read: (scena) => WITHOUT_HTTPS.read(scena.store),
  apply: (scena, value) => WITHOUT_HTTPS.set(scena.store, value),
  watch: (scena, changed) => scena.store.subscribe(WITHOUT_HTTPS.path, changed),
};

/** Each mark's mode as a UI setting, `ui.agentTools.<command>`, after `ui.agentToolsWithoutHttps` on a page that needs it. */
export const toolSettings = (): UiSetting[] => [...(insecurePage() ? [withoutHttps] : []), ...ordered().map((one): UiSetting => ({
  key: `ui.agentTools.${one.id}` as UiKey,
  values: () => MODES,
  usual: () => one.choice.usual,
  title: (scena) => commandTitle(scena, one.id),
  description: () => one.id,
  label: (value) => translate(`sessions/agentTools/modes/${value}`),
  read: (scena) => one.choice.read(scena.store),
  apply: (scena, value) => one.choice.set(scena.store, value),
  watch: (scena, changed) => scena.store.subscribe(one.choice.path, changed),
}))];
