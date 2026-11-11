/**
 * Which folders this browser trusts on each host, and which the host does.
 *
 * ahpd keeps one `workspaceTrust` root config value, set by the last push from
 * any client, and publishes it in its root state. A folder it trusts, itself or
 * under a trusted parent, is not asked about. This browser's answers live here
 * and go to the host on connect. A no is kept with the yeses, so a folder is
 * asked about once; only the yeses are sent, joined to the host's own list, so
 * a push never drops a folder another window trusted.
 */

import type { BindingPath, ReactiveStore } from '@softov/scena/types';
import type { RootState, StateAction } from '@microsoft/agent-host-protocol';
import { perHostKey } from '../lib/storage-keys.js';
import { bare } from '../resources/folders/roots.js';
import { folderUri } from './words.js';

/** `{ [folderUri]: trusted }`, each folder spelled once. */
export type TrustAnswers = Readonly<Record<string, boolean>>;

/** Where the store keeps a host's answers. */
export const trustPath = (host: string): BindingPath => `$/ahp/trust/${encodeURIComponent(host)}` as BindingPath;

const trustKey = (host: string): string => perHostKey('ahpd-web.trust', host);

/** One folder, one spelling: its URI with no trailing slash, whether it came as a path or a URI. */
export const trustKeyOf = (folder: string): string => bare(folderUri(folder));

/** A host's answers, from storage; none when storage is blocked or holds something else. */
export function readTrust(host: string): TrustAnswers {
  try {
    const held = JSON.parse(window.localStorage.getItem(trustKey(host)) ?? '{}') as unknown;
    if (typeof held !== 'object' || held === null || Array.isArray(held)) return {};
    return Object.fromEntries(Object.entries(held).filter((one): one is [string, boolean] => typeof one[1] === 'boolean'));
  } catch {
    return {};
  }
}

/** Keep a host's answers, in the store and in storage. */
export function keepTrust(store: ReactiveStore, host: string, answers: TrustAnswers): void {
  store.set(trustPath(host), answers);
  try {
    window.localStorage.setItem(trustKey(host), JSON.stringify(answers));
  } catch {
    // Storage blocked: the answers last as long as the page.
  }
}

/** What this browser answered about a folder, or undefined when it was never asked. */
export function answerOf(answers: TrustAnswers | undefined, folder: string): boolean | undefined {
  return answers?.[trustKeyOf(folder)];
}

export function withAnswer(answers: TrustAnswers, folder: string, trusted: boolean): TrustAnswers {
  return { ...answers, [trustKeyOf(folder)]: trusted };
}

export function withoutAnswer(answers: TrustAnswers, folder: string): TrustAnswers {
  const key = trustKeyOf(folder);
  return Object.fromEntries(Object.entries(answers).filter(([uri]) => uri !== key));
}

/** The folders answered yes, which is all the host is told. */
export function trustedUris(answers: TrustAnswers): string[] {
  return Object.entries(answers).filter(([, trusted]) => trusted).map(([uri]) => uri);
}

/** The host's `workspaceTrust`: whether it reads trust at all, and the folders it trusts. */
export interface HostTrust {
  enabled: boolean;
  trustedUris: string[];
}

/** The host's `workspaceTrust` from its root state, or undefined when it holds none. */
export function hostTrustOf(root: RootState | undefined): HostTrust | undefined {
  const held = root?.config?.values['workspaceTrust'];
  if (typeof held !== 'object' || held === null) return undefined;
  const { enabled, trustedUris: uris } = held as { enabled?: unknown; trustedUris?: unknown };
  return {
    enabled: enabled !== false,
    trustedUris: Array.isArray(uris) ? uris.filter((one): one is string => typeof one === 'string') : [],
  };
}

/**
 * Whether the host trusts `folder`, as ahpd reads its value: none held is
 * untrusted, `enabled: false` trusts everything, and otherwise the folder or a
 * parent of it is in the list. ahpd also settles symlinks and case, which a
 * browser cannot, so a miss here only means the person is asked.
 */
export function trustedOnHost(trust: HostTrust | undefined, folder: string): boolean {
  if (trust === undefined) return false;
  if (!trust.enabled) return true;
  const key = trustKeyOf(folder);
  return trust.trustedUris.some((uri) => {
    const parent = trustKeyOf(uri);
    return key === parent || key.startsWith(parent.endsWith('/') ? parent : `${parent}/`);
  });
}

/** The host's list with `uris` added, each folder once, the host's first. */
export function joinedUris(trust: HostTrust | undefined, uris: readonly string[]): string[] {
  const held = trust?.trustedUris ?? [];
  const keys = new Set(held.map(trustKeyOf));
  return [...held, ...uris.filter((uri) => !keys.has(trustKeyOf(uri)))];
}

/** The push that sets the host's one list of trusted folders, for every client; it replaces the list the host held. */
export function trustAction(uris: readonly string[]): StateAction {
  return { type: 'root/configChanged', config: { workspaceTrust: { enabled: true, trustedUris: [...uris] } } } as StateAction;
}
