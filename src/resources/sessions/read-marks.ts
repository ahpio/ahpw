/** Where an open session's reading stood: which session, and whether a turn was running or waiting on the person. */
export interface ReadMark {
  resource: string;
  working: boolean;
}

/**
 * Whether the open session marks itself read now: it has just opened, or its
 * turn has just ended, which is the summary update the host marks it unread
 * in. Anything else, such as a person's *Mark unread*, leaves it as it is.
 */
export function marksRead(was: ReadMark | undefined, now: ReadMark): boolean {
  return was === undefined || was.resource !== now.resource || (was.working && !now.working);
}
