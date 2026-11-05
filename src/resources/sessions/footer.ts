import type { SessionModelInfo, UsageInfo } from '@microsoft/agent-host-protocol';
import { getLocale, translate } from '@softov/scena';
import type { ContextUsage } from '../../bridges/usage-meta.js';
import type { Option } from './composer-commands.js';
import { tokens } from './turn.js';

/**
 * Which side of the footer a setting sits on: one that holds for a chat, as
 * effort, beside the model on the right; one for the whole session, as
 * approvals, on the left. AHP 1.0.0 does not type `scope`; ahpd's backends send it.
 */
export function footerSide(option: Option): 'left' | 'right' {
  return (option.schema as { scope?: unknown }).scope === 'chat' ? 'right' : 'left';
}

/**
 * The context size beside the model.
 *
 * The session's own breakdown, where the host sends one, is what fills the
 * window now: its total over the window the conversation compacts at, as
 * `40k / 600k`. Otherwise the last turn's input over the model's window, or
 * the window alone before a turn. Nothing when neither gives a window.
 */
export function contextReadout(model: SessionModelInfo | undefined, usage: UsageInfo | undefined, context?: ContextUsage): { text: string; title: string; fraction?: number } | null {
  const words = (count: number): string => count.toLocaleString(getLocale());
  const size = context?.figures?.size ?? context?.figures?.limit;
  if (context !== undefined && size !== undefined) {
    return { text: `${tokens(context.total)} / ${tokens(size)}`, title: translate('sessions/footer/now', { used: words(context.total), window: words(size) }), fraction: filled(context.total, size) };
  }
  const window = model?.maxContextWindow;
  if (window === undefined) return null;
  if (usage?.inputTokens === undefined) return { text: tokens(window), title: translate('sessions/footer/window', { window: words(window) }) };
  const used = usage.inputTokens + (usage.cacheReadTokens ?? 0);
  return { text: `${tokens(used)} / ${tokens(window)}`, title: translate('sessions/footer/used', { used: words(used), window: words(window) }), fraction: filled(used, window) };
}

/** How full a window is, from 0 to 1. */
const filled = (used: number, window: number): number => (window <= 0 ? 0 : Math.min(1, Math.max(0, used / window)));

/**
 * The ring's colour for how full the window is: the theme's accent when
 * empty, mixed toward its warning colour as it fills.
 */
export function ringColor(fraction: number): string {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return `color-mix(in oklch, var(--oo-color-warning) ${percent}%, var(--oo-color-accent))`;
}
