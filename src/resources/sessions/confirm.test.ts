import { describe, expect, it } from 'vitest';
import type { ConfirmationOption } from '@microsoft/agent-host-protocol';
import { confirmLayout } from './confirm.js';

/** One option as a host sends it; the protocol's kind is a const enum of these two words. */
const option = (id: string, label: string, kind: 'approve' | 'deny', group: number): ConfirmationOption => ({ id, label, kind, group }) as unknown as ConfirmationOption;

/** A shell call's options, as the host in VS Code's confirmation sends them. */
const SHELL: ConfirmationOption[] = [
  option('once', 'Allow Once', 'approve', 1),
  option('prefix-session', 'Allow `whois ...` in this Session', 'approve', 2),
  option('exact-session', 'Allow Exact Command in this Session', 'approve', 3),
  option('prefix-always', 'Always Allow `whois ...`', 'approve', 2),
  option('skip', 'Skip', 'deny', 4),
];

describe('confirmLayout', () => {
  it('makes the first approving option the main button, and the other approving ones its menu, in the host order', () => {
    const layout = confirmLayout(SHELL);
    expect(layout.main?.id).toBe('once');
    expect(layout.more.map((one) => one.option.id)).toEqual(['prefix-session', 'exact-session', 'prefix-always']);
    expect(layout.deny.map((one) => one.id)).toEqual(['skip']);
  });

  it('starts a new part where the group changes, and keeps the host order when a group comes back', () => {
    expect(confirmLayout(SHELL).more.map((one) => one.part)).toEqual([0, 1, 2]);
    const runs = confirmLayout([SHELL[0]!, SHELL[1]!, SHELL[3]!, SHELL[2]!]).more;
    expect(runs.map((one) => [one.option.id, one.part])).toEqual([['prefix-session', 0], ['prefix-always', 0], ['exact-session', 1]]);
  });

  it('has no menu for a single approving option', () => {
    const layout = confirmLayout([SHELL[0]!, SHELL[4]!]);
    expect(layout.more).toEqual([]);
  });

  it('has no main button when the host sends only denials', () => {
    const layout = confirmLayout([SHELL[4]!]);
    expect(layout.main).toBeUndefined();
    expect(layout.deny).toHaveLength(1);
  });
});
