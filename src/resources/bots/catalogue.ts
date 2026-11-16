/**
 * A host's bots, as ahpd's bot plugin serves them: the catalogue channel that
 * lists them, and the `x-ahpd/bots/*` commands that make, edit and delete one,
 * or the resource writes on a host without them. The record is written here
 * rather than imported: `@ahpd/bot` reads `node:fs`.
 */

import { AhpErrorCodes } from '@microsoft/agent-host-protocol';
import { hostBridge } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';
import { newId } from '../../bridges/words.js';

export const BOTS_SCHEME = 'x-ahpd-bots';
export const BOTS = `${BOTS_SCHEME}://`;
/** The resource scheme each bot is a file of, its record as JSON. */
export const BOT_PROVIDER = 'bot';

/** A bot as a host keeps it, as `@ahpd/bot`'s `BotRecord`. */
export interface BotRecord {
  /** Its slug, which names its resource. */
  id: string;
  name: string;
  labels: string[];
  description?: string;
  body: string;
  /** A colour name, or `#rrggbb`. */
  color: string;
  instructions?: string;
  template?: string;
  harness?: string;
  model?: string;
  preset?: string;
  workspace: string;
  computer?: string;
  /** The bot's own session on a host that does not run bot chats yet; on one that does, a read's answer: the reader's own talk. */
  session?: string;
  /** `user:<id>`, `team:<team>`, `project:<team>:<project>` or `root:<host>`. */
  owner: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * The catalogue as this client holds it.
 *
 * A host sends `{ records }`, each `{ id, record }` with the record a read of
 * the bot answers this reader, its own talk as `session` among it. A host up to
 * 0.15.0-rc.3 sends `{ bots }`, each the stored record. The reducer keeps
 * `{ bots }`, with `talks` true when the host sent records. Read it with `botsIn`.
 */
export interface BotsState {
  bots?: BotRecord[];
  records?: { id: string; record: Record<string, unknown> }[];
  /** Whether each bot's `session` is the reader's own talk, as a host that sends records says it. */
  talks?: boolean;
}

/** One `{ id, record }` entry as a bot, or undefined when it is not one. */
const entryBot = (entry: unknown): BotRecord | undefined => {
  if (typeof entry !== 'object' || entry === null) return undefined;
  const { id, record } = entry as { id?: unknown; record?: unknown };
  if (typeof id !== 'string' || typeof record !== 'object' || record === null) return undefined;
  return { ...(record as BotRecord), id };
};

/** The bots of a catalogue state, in either shape a host sends. */
export function botsIn(state: BotsState | undefined): BotRecord[] {
  if (state === undefined) return [];
  if (Array.isArray(state.records)) return state.records.flatMap((one) => entryBot(one) ?? []);
  return state.bots ?? [];
}

/** Whether the catalogue carries the reader's own talk on each bot, so none is read. */
export const sendsTalks = (state: BotsState | undefined): boolean => state?.talks === true || Array.isArray(state?.records);

type BotsAction =
  | { type: `${typeof BOTS_SCHEME}/added` | `${typeof BOTS_SCHEME}/changed`; id?: string; record?: Record<string, unknown>; bot?: BotRecord }
  | { type: `${typeof BOTS_SCHEME}/removed`; id: string };

/** Folds the catalogue's actions into `{ bots }`, kept in slug order as the host sends it, from either shape. */
export function botsReducer(state: BotsState, action: BotsAction): BotsState {
  const bots = botsIn(state);
  const talks = sendsTalks(state);
  switch (action.type) {
    case `${BOTS_SCHEME}/added`:
    case `${BOTS_SCHEME}/changed`: {
      const bot = action.record === undefined ? action.bot : entryBot(action);
      if (bot === undefined) return state;
      const others = bots.filter((one) => one.id !== bot.id);
      return { bots: [...others, bot].sort((a, b) => a.id.localeCompare(b.id)), ...(talks ? { talks } : {}) };
    }
    case `${BOTS_SCHEME}/removed`:
      return { bots: bots.filter((one) => one.id !== action.id), ...(talks ? { talks } : {}) };
    default:
      return state;
  }
}

/** The command that makes or edits a bot. */
export const BOT_PUT = 'x-ahpd/bots/put';

/** The command that deletes a bot. */
export const BOT_REMOVE = 'x-ahpd/bots/remove';

/** The root of the host's bots, as its provider says; `bot://` when it does not. */
export const botsRoot = (offers: Offers): string => offers.providers[BOT_PROVIDER]?.root ?? `${BOT_PROVIDER}://`;

/** A bot's resource: its provider's root and its slug. */
export const botUri = (root: string, slug: string): string => `${root.endsWith('/') ? root : `${root}/`}${slug}`;

/** What a write sends: the fields a person sets; the host fills the rest. */
export type BotBody = Partial<Pick<BotRecord, 'name' | 'labels' | 'description' | 'body' | 'color' | 'instructions' | 'owner'>>;

const isTaken = (error: unknown): boolean => typeof error === 'object' && error !== null && (error as { code?: unknown }).code === AhpErrorCodes.AlreadyExists;

/**
 * Makes a bot under the first free slug from `slugs`: a host never gives a
 * deleted bot's slug again, so a refused one moves on to the next. Answers the slug.
 */
export async function makeBot(host: string, offers: Offers, slugs: readonly string[], body: BotBody): Promise<string> {
  const root = botsRoot(offers);
  for (const [at, slug] of slugs.entries()) {
    try {
      if (offers.methods.includes(BOT_PUT)) await hostBridge(host).request(BOT_PUT as never, { id: slug, record: body, createOnly: true } as never);
      else await hostBridge(host).writeResource(botUri(root, slug), JSON.stringify(body), 'utf-8', true);
      return slug;
    } catch (error) {
      if (!isTaken(error) || at === slugs.length - 1) throw error;
    }
  }
  throw new Error('No slug to make the bot under');
}

/** Edits a bot, refused when it changed on the host since `updatedAt`. */
export async function editBot(host: string, offers: Offers, bot: BotRecord, body: BotBody): Promise<void> {
  if (offers.methods.includes(BOT_PUT)) {
    await hostBridge(host).request(BOT_PUT as never, { id: bot.id, record: body, ifMatch: bot.updatedAt } as never);
    return;
  }
  await hostBridge(host).writeText(botUri(botsRoot(offers), bot.id), JSON.stringify(body), bot.updatedAt);
}

/** The agent a host runs bot chats with; a host without it keeps one session per bot. */
export const BOT_CHAT_AGENT = 'bot-chat';

/** Whether a host runs bot chats, by the agents it lists. */
export const servesBotChats = (agents: readonly { provider: string }[] | undefined): boolean =>
  agents?.some((one) => one.provider === BOT_CHAT_AGENT) ?? false;

/**
 * The session a person talks to a bot in, where they have one. On a host that
 * runs bot chats, the catalogue's record carries `session`, the reader's own
 * talk, where `talks` says so; a host before that answers it on a read of the
 * bot. On one that does not yet, it is the bot's own session. Null when there is none.
 */
export async function readBotChat(host: string, offers: Offers, bot: BotRecord, chats: boolean, talks = false): Promise<string | null> {
  if (!chats || talks) return bot.session ?? null;
  const { text } = await hostBridge(host).readText(botUri(botsRoot(offers), bot.id));
  const record = JSON.parse(text ?? '{}') as { session?: unknown };
  return typeof record.session === 'string' && record.session !== '' ? record.session : null;
}

/** Makes this person's talk with a bot, a `bot-chat` session naming it in its config. Answers the session. */
export async function startBotChat(host: string, bot: BotRecord): Promise<string> {
  const resource = `ahp-session:/${newId()}`;
  await hostBridge(host).request('createSession', { channel: resource, provider: BOT_CHAT_AGENT, config: { bot: bot.id } } as never);
  return resource;
}

/** The person's talk with a bot: the one they have, or a new one on a host that runs bot chats. Null when there is none to open. */
export async function openBotChat(host: string, offers: Offers, bot: BotRecord, chats: boolean, talks = false): Promise<string | null> {
  const held = await readBotChat(host, offers, bot, chats, talks);
  if (held !== null || !chats) return held;
  return startBotChat(host, bot);
}

export async function deleteBot(host: string, offers: Offers, slug: string): Promise<void> {
  if (offers.methods.includes(BOT_REMOVE)) {
    await hostBridge(host).request(BOT_REMOVE as never, { id: slug } as never);
    return;
  }
  await hostBridge(host).deleteResource(botUri(botsRoot(offers), slug), false);
}
