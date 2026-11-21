/**
 * The AHP 1.2.0 automation fields this client writes before its package has
 * them: the one-time trigger, `target`, and the capabilities that offer them.
 *
 * Copied from AHP main at `e36b0a20`. Dropped for the package's own types
 * when `@microsoft/agent-host-protocol` 1.2.0 ships.
 * https://github.com/microsoft/agent-host-protocol/blob/e36b0a20/types/channels-automation/state.ts
 */
import type { AutomationCapabilities } from '@microsoft/agent-host-protocol';

/** A trigger that starts one run at `runAt`. */
export interface OneTimeTrigger {
  id: string;
  kind: 'oneTime';
  /** ISO 8601. */
  runAt: string;
  misfirePolicy?: 'runOnce' | 'skip';
}

/** Where each run of an automation sends its message. Absent is `newSession`. */
export type RunTarget =
  | { kind: 'newSession' }
  | { kind: 'previousSession' }
  | { kind: 'chat'; session: string; chat: string };

/** The automation capabilities, with what 1.2.0 adds. */
export type NextCapabilities = AutomationCapabilities & {
  oneTime?: Record<string, never>;
  targets?: { previousSession?: Record<string, never>; chat?: Record<string, never> };
};

/** A trigger read as a one-time trigger, where it is one. */
export const oneTimeOf = (trigger: unknown): OneTimeTrigger | undefined => {
  const held = trigger as Partial<OneTimeTrigger> | undefined;
  return held?.kind === 'oneTime' && typeof held.runAt === 'string' ? held as OneTimeTrigger : undefined;
};

/** Where a definition's runs go: `target`, or the older `_meta.ahpd.session: 'pinned'` as `previousSession`. */
export const targetOf = (definition: { target?: unknown; _meta?: Record<string, unknown> } | undefined): RunTarget => {
  const target = definition?.target as Partial<{ kind: string; chat: string; session: string }> | undefined;
  if (target?.kind === 'chat' && typeof target.chat === 'string') return { kind: 'chat', chat: target.chat, session: target.session ?? '' };
  if (target?.kind === 'previousSession') return { kind: 'previousSession' };
  if (target?.kind === 'newSession') return { kind: 'newSession' };
  const ahpd = definition?._meta?.['ahpd'] as { session?: unknown } | undefined;
  return ahpd?.session === 'pinned' ? { kind: 'previousSession' } : { kind: 'newSession' };
};
