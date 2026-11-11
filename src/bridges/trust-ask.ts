/**
 * Asking whether to trust a folder, and telling the host.
 *
 * A folder the host already trusts is not asked about. Otherwise a folder is
 * asked about once per host: a kept no answers at once, and a kept yes is sent
 * again without asking. A yes is kept only once the host takes the list that
 * holds it, so a host that refuses leaves the question standing; a no is kept
 * at once, since untrusted is what the host already assumes; closing the
 * question keeps nothing.
 */

import { translate } from '@softov/scena';
import type { ReactiveStore } from '@softov/scena/types';
import { choose } from '../shell/notify/confirm.js';
import { failed } from '../shell/notify/index.js';
import type { RootState } from '@microsoft/agent-host-protocol';
import { channelPath, hostBridge, ROOT } from './data.js';
import { answerOf, hostTrustOf, joinedUris, keepTrust, readTrust, trustAction, trustedOnHost, trustedUris, trustPath, withAnswer, type HostTrust, type TrustAnswers } from './trust.js';
import { folderLabel, folderName } from './words.js';

export type TrustOutcome = 'trusted' | 'untrusted' | 'closed';

/** A host's answers, as the store holds them since its last connect. */
export const answersOf = (store: ReactiveStore, host: string): TrustAnswers => store.get<TrustAnswers>(trustPath(host)) ?? readTrust(host);

/** The host's `workspaceTrust`, from the root state the page follows, else read once; undefined when it cannot be read. */
async function hostTrust(store: ReactiveStore, host: string): Promise<HostTrust | undefined> {
  const followed = store.get<RootState>(channelPath(host, ROOT));
  if (followed !== undefined) return hostTrustOf(followed);
  try {
    return hostTrustOf(await hostBridge(host).readOnce<RootState>(ROOT));
  } catch {
    return undefined;
  }
}

/**
 * Tell the host the folders `next` trusts, joined to the host's own list so no
 * other window's folder is dropped, and keep `next` once it takes them; a
 * refusal throws with the host's words.
 */
export async function sendTrust(store: ReactiveStore, host: string, next: TrustAnswers, onHost?: HostTrust): Promise<void> {
  const refused = await hostBridge(host).dispatchAndWait(ROOT, trustAction(joinedUris(onHost, trustedUris(next))));
  if (refused !== null) throw new Error(refused);
  keepTrust(store, host, next);
}

/**
 * Whether `folder` is trusted on `host`: the host's own list, then the kept
 * answer, then the person's, asked now. A host refusing a yes throws.
 */
export async function askTrust(store: ReactiveStore, host: string, folder: string): Promise<TrustOutcome> {
  const onHost = await hostTrust(store, host);
  if (trustedOnHost(onHost, folder)) return 'trusted';
  const answers = answersOf(store, host);
  const held = answerOf(answers, folder);
  if (held === false) return 'untrusted';
  if (held === true) {
    await sendTrust(store, host, answers, onHost);
    return 'trusted';
  }
  const said = await choose({
    title: translate('trust/ask/title', { folder: folderName(folder) }),
    body: translate('trust/ask/body', { path: folderLabel(folder) }),
    confirmLabel: translate('trust/ask/yes'),
    cancelLabel: translate('trust/ask/no'),
  });
  if (said === null) return 'closed';
  if (!said) {
    keepTrust(store, host, withAnswer(answers, folder, false));
    return 'untrusted';
  }
  await sendTrust(store, host, withAnswer(answers, folder, true), onHost);
  return 'trusted';
}

/** The host's own question, before a session moves to or adds a folder: the same prompt, where anything but a yes is a no. */
export async function answerTrust(store: ReactiveStore, host: string, folder: string): Promise<boolean> {
  try {
    return (await askTrust(store, host, folder)) === 'trusted';
  } catch (error) {
    failed(translate('trust/ask/refused'), error);
    return false;
  }
}
