import type { ConfirmationOption } from '@microsoft/agent-host-protocol';

/** How a call's options are drawn: the main button, the rest of its kind in a menu beside it, and each denial as its own button. */
export interface ConfirmLayout {
  /** The first approving option, in the host's order. */
  main: ConfirmationOption | undefined;
  /** The other approving options, in the host's order, each with the run of equal groups it is in; a new run is a divider. */
  more: { option: ConfirmationOption; part: number }[];
  /** The denying options, in the host's order. */
  deny: ConfirmationOption[];
}

/** The options a host sends for a call, laid out as VS Code's confirmation draws them. */
export function confirmLayout(options: readonly ConfirmationOption[]): ConfirmLayout {
  const approve = options.filter((one) => one.kind === 'approve');
  let part = 0;
  const more = approve.slice(1).map((option, at, all) => {
    if (at > 0 && option.group !== all[at - 1]?.group) part += 1;
    return { option, part };
  });
  return { main: approve[0], more, deny: options.filter((one) => one.kind !== 'approve') };
}
