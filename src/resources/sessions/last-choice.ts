import { hostKey } from '../../lib/storage-keys.js';

/** Where the choices last made for a new session are kept, per window. */
export const LAST_CHOICE_KEY = hostKey('ahpd-web.last-choice');

/** What was chosen the last time a session was started on a host. */
export interface LastChoice {
  /** The harness (agent provider). */
  provider: string;
  /** The model chosen per provider, absent for the default. */
  models: Record<string, string>;
  /** The settings chosen per provider, such as the level of the model. */
  config: Record<string, Record<string, unknown>>;
}

function readAll(): Record<string, LastChoice> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(LAST_CHOICE_KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, LastChoice>) : {};
  } catch {
    return {};
  }
}

/** The choices last made on the host, or undefined when none were. */
export function readLastChoice(host: string): LastChoice | undefined {
  const one = readAll()[host];
  if (one === undefined || typeof one.provider !== 'string') return undefined;
  return { provider: one.provider, models: one.models ?? {}, config: one.config ?? {} };
}

/** Keeps the choices of a started session; the other providers' choices on the host stay as they were. */
export function writeLastChoice(host: string, provider: string, model: string, config: Record<string, unknown>): void {
  try {
    const all = readAll();
    const before = readLastChoice(host);
    const models = { ...(before?.models ?? {}) };
    if (model === '') delete models[provider]; else models[provider] = model;
    all[host] = { provider, models, config: { ...(before?.config ?? {}), [provider]: config } };
    localStorage.setItem(LAST_CHOICE_KEY, JSON.stringify(all));
  } catch {
    // Not kept, which only means the next one starts from the defaults.
  }
}
