import type { BackgroundWork, TerminalState } from '@microsoft/agent-host-protocol';

/** `BackgroundWork._meta` key: `true` when the host can stop the work with `vscode/stopBackgroundWork`. */
export const STOP_WORK = 'vscode.stopBackgroundWork';

/** One shell a chat runs in the background, as the composer lists it. */
export interface Shell {
  /** The row's id, which `vscode/stopBackgroundWork` takes. */
  id: string;
  /** The name the list shows: the label, else the command, else the id. */
  name: string;
  command: string;
  /** When it started, in milliseconds, or `undefined` when the host sent no time ahpw can read. */
  startedAt: number | undefined;
  /** The terminal channel that carries its output, when the host gave one. */
  terminal?: string;
  /** Whether the host lets the person stop it. */
  canStop: boolean;
}

/** How a shell's terminal stands: running, or exited with its code when the host sent one. */
export type ShellStatus = { kind: 'running' } | { kind: 'exited'; exitCode?: number };

const trimmed = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * The shells among a chat's background work.
 *
 * Only rows of kind `shell`: the set of kinds is open, and a kind ahpw does
 * not know is skipped rather than drawn as a shell.
 */
export function shellsOf(work: readonly BackgroundWork[] | undefined): Shell[] {
  const shells: Shell[] = [];
  for (const row of work ?? []) {
    if (String(row.kind) !== 'shell' || !('command' in row)) continue;
    const command = trimmed(row.command);
    const started = Date.parse(row.startedAt);
    shells.push({
      id: row.id,
      name: trimmed(row.label) || command || row.id,
      command,
      startedAt: Number.isNaN(started) ? undefined : started,
      ...(typeof row.terminal === 'string' && row.terminal !== '' ? { terminal: row.terminal } : {}),
      canStop: row._meta?.[STOP_WORK] === true,
    });
  }
  return shells;
}

/** A shell's status, from its terminal's lifecycle; `undefined` before the terminal's state arrives. */
export function statusOf(state: TerminalState | undefined): ShellStatus | undefined {
  if (state === undefined) return undefined;
  if (String(state.lifecycle.status) !== 'exited') return { kind: 'running' };
  const code = (state.lifecycle as { exitCode?: unknown }).exitCode;
  return typeof code === 'number' ? { kind: 'exited', exitCode: code } : { kind: 'exited' };
}
