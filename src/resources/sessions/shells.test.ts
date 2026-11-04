import { describe, expect, it } from 'vitest';
import type { BackgroundWork, TerminalState } from '@microsoft/agent-host-protocol';
import { shellsOf, statusOf } from './shells.js';

/** Rows as the host sends them; `kind` is a plain string, as on the wire. */
const rows = (...given: Record<string, unknown>[]): BackgroundWork[] => given as unknown as BackgroundWork[];

const terminal = (lifecycle: Record<string, unknown>): TerminalState => ({ lifecycle }) as unknown as TerminalState;

describe('shellsOf', () => {
  it('keeps shell rows and skips the kinds it does not know', () => {
    const work = rows(
      { id: 's1', kind: 'shell', label: 'Dev server', command: 'pnpm dev', startedAt: '2026-11-04T06:00:00Z', terminal: 'ahp-terminal:/1', _meta: { 'vscode.stopBackgroundWork': true } },
      { id: 'a1', kind: 'subagent', label: 'Explore', chat: 'ahp-chat:/2', startedAt: '2026-11-04T06:00:00Z' },
      { id: 'x1', kind: 'somethingNew', label: 'New', command: 'x', startedAt: '2026-11-04T06:00:00Z' },
    );
    expect(shellsOf(work)).toEqual([
      { id: 's1', name: 'Dev server', command: 'pnpm dev', startedAt: Date.parse('2026-11-04T06:00:00Z'), terminal: 'ahp-terminal:/1', canStop: true },
    ]);
  });

  it('names a shell by its command when the label is blank', () => {
    const [shell] = shellsOf(rows({ id: 's1', kind: 'shell', label: '  ', command: ' pnpm test ', startedAt: 'not a time' }));
    expect(shell).toEqual({ id: 's1', name: 'pnpm test', command: 'pnpm test', startedAt: undefined, canStop: false });
  });

  it('offers no stop unless the host sets the flag to true', () => {
    const [shell] = shellsOf(rows({ id: 's1', kind: 'shell', label: 'a', command: 'a', startedAt: '', _meta: { 'vscode.stopBackgroundWork': 'yes' } }));
    expect(shell?.canStop).toBe(false);
  });

  it('answers no shells for no work', () => {
    expect(shellsOf(undefined)).toEqual([]);
  });
});

describe('statusOf', () => {
  it('reads running, exited with a code, and exited without one', () => {
    expect(statusOf(undefined)).toBeUndefined();
    expect(statusOf(terminal({ status: 'running' }))).toEqual({ kind: 'running' });
    expect(statusOf(terminal({ status: 'exited', exitCode: 2 }))).toEqual({ kind: 'exited', exitCode: 2 });
    expect(statusOf(terminal({ status: 'exited' }))).toEqual({ kind: 'exited' });
  });
});
