/** What the bot form holds, and what a write sends from it. */

import type { BotBody, BotRecord } from './catalogue.js';
import { BOT_BODIES, COLOR_HEX, bodyName, colorName, colorOf } from './look.js';

export interface BotDraft {
  name: string;
  /** One line, comma separated. */
  labels: string;
  description: string;
  instructions: string;
  body: string;
  /** A hex, as the swatches draw it. */
  color: string;
  /** Empty for the maker, the host's default. */
  owner: string;
  /** The agent: the bot's `preset`, else its `provider`; empty for the host's default agent. */
  agent: string;
  /** Whether `agent` is the bot's `preset`, which a change of agent clears. */
  preset: boolean;
  /** Empty for the agent's default model. */
  model: string;
  /** Empty for this host. */
  computer: string;
  /** Each connector the bot may use, in the order the form lists them. */
  connectors: BotConnector[];
  /** The template a new bot's `AGENTS.md` is made from; empty for the default. */
  template: string;
  /** A new bot's folder; empty for the host's default. */
  workspace: string;
}

/** One connector of a bot: the word the bot uses, and the `connectors://<adapter>/<id>` it stands for. */
export interface BotConnector {
  alias: string;
  target: string;
}

/** The form of a connector alias, as the host takes it. */
export const ALIAS_PATTERN = /^[a-z][a-z0-9-]{0,39}$/u;

/** Labels from one comma separated line: trimmed, blank and repeated ones left out. */
export function parseLabels(line: string): string[] {
  return [...new Set(line.split(',').map((one) => one.trim()).filter((one) => one !== ''))];
}

/**
 * A look for a new bot: a random body, and the colour the fewest bots on the
 * host have, so a new one stands out among them.
 */
export function freshLook(bots: readonly BotRecord[], random = Math.random): { body: string; color: string } {
  const used = new Map<string, number>(Object.values(COLOR_HEX).map((hex) => [hex, 0]));
  for (const bot of bots) {
    const hex = colorOf(bot.color);
    if (used.has(hex)) used.set(hex, used.get(hex)! + 1);
  }
  const least = Math.min(...used.values());
  const color = [...used].find(([, count]) => count === least)![0];
  return { body: BOT_BODIES[Math.floor(random() * BOT_BODIES.length)]!, color };
}

/** The form's start: the bot as it is, or a fresh one. */
export function draftOf(bot: BotRecord | undefined, bots: readonly BotRecord[]): BotDraft {
  if (bot !== undefined) {
    return {
      name: bot.name,
      labels: bot.labels.join(', '),
      description: bot.description ?? '',
      instructions: bot.instructions ?? '',
      body: bot.body,
      color: colorOf(bot.color),
      owner: bot.owner,
      agent: bot.preset ?? bot.provider ?? '',
      preset: bot.preset !== undefined,
      model: bot.model ?? '',
      computer: bot.computer ?? '',
      connectors: Object.entries(bot.connectors ?? {}).map(([alias, target]) => ({ alias, target })),
      template: bot.template ?? '',
      workspace: bot.workspace,
    };
  }
  const look = freshLook(bots);
  return {
    name: bodyName(look.body), labels: '', description: '', instructions: '', owner: '',
    agent: '', preset: false, model: '', computer: '', connectors: [], template: '', workspace: '', ...look,
  };
}

/** The draft after a change of agent: the model starts again from the new agent's default. */
export const withAgent = (draft: BotDraft, agent: string): BotDraft => (agent === draft.agent ? draft : { ...draft, agent, model: '' });

/** The connectors as the host keeps them: an alias to its connector, blank aliases left out. */
export const connectorMap = (connectors: readonly BotConnector[]): Record<string, string> =>
  Object.fromEntries(connectors.filter((one) => one.alias.trim() !== '' && one.target !== '').map((one) => [one.alias.trim(), one.target]));

/** A free alias for a connector, from its adapter name: `mail`, then `mail-2`. */
export function freeAlias(target: string, taken: readonly string[]): string {
  const adapter = /^connectors:\/\/([^/]+)\//u.exec(target)?.[1] ?? 'connector';
  const word = adapter.toLowerCase().replace(/[^a-z0-9-]+/gu, '-').replace(/^[^a-z]+/u, '').slice(0, 30) || 'connector';
  if (!taken.includes(word)) return word;
  for (let n = 2; ; n += 1) if (!taken.includes(`${word}-${String(n)}`)) return `${word}-${String(n)}`;
}

/** Whether every connector has an alias the host takes, and no alias is used twice. */
export function connectorsValid(connectors: readonly BotConnector[]): boolean {
  const aliases = connectors.map((one) => one.alias.trim());
  return aliases.every((one) => ALIAS_PATTERN.test(one)) && new Set(aliases).size === aliases.length;
}

/**
 * A bot's name after its body changes: an empty name, or the one the old body
 * offered, follows the body; a name somebody typed stays.
 */
export function renamedFor(name: string, from: string, to: string): string {
  const typed = name.trim();
  return typed === '' || typed === bodyName(from) ? bodyName(to) : name;
}

/**
 * What a write sends.
 *
 * A new bot sends each field it sets. The owner, the template and the folder
 * go only on a new bot, since a host keeps them. An edit sends the look and the
 * words as they are, and the agent, model, computer and connectors only where
 * they changed from `start`: a blank one clears it.
 * A changed agent is sent as `provider`, and clears a `preset` the bot had.
 */
export function recordBody(draft: BotDraft, fresh: boolean, start?: BotDraft): BotBody {
  const description = draft.description.trim();
  const instructions = draft.instructions.trim();
  const connectors = connectorMap(draft.connectors);
  const changed = (key: 'agent' | 'model' | 'computer'): boolean => (fresh ? draft[key] !== '' : start !== undefined && draft[key] !== start[key]);
  const connectorsChanged = fresh
    ? Object.keys(connectors).length > 0
    : start !== undefined && JSON.stringify(connectors) !== JSON.stringify(connectorMap(start.connectors));
  return {
    name: draft.name.trim(),
    labels: parseLabels(draft.labels),
    body: draft.body.trim(),
    color: colorName(draft.color),
    ...(fresh ? (description === '' ? {} : { description }) : { description }),
    ...(fresh ? (instructions === '' ? {} : { instructions }) : { instructions }),
    ...(fresh && draft.owner !== '' ? { owner: draft.owner } : {}),
    ...(changed('agent') ? { provider: draft.agent, ...(start?.preset === true ? { preset: '' } : {}) } : {}),
    ...(changed('model') ? { model: draft.model } : {}),
    ...(changed('computer') ? { computer: draft.computer } : {}),
    ...(connectorsChanged ? { connectors } : {}),
    ...(fresh && draft.template.trim() !== '' ? { template: draft.template.trim() } : {}),
    ...(fresh && draft.workspace.trim() !== '' ? { workspace: draft.workspace.trim() } : {}),
  };
}
