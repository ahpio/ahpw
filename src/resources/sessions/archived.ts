/**
 * Whether an open session's tab closes now: the session has just become
 * archived, and the person keeps the usual choice to close it. A session that
 * was archived when it opened stays open.
 */
export function closesOnArchive(was: boolean | undefined, now: boolean, choice: string): boolean {
  return choice === 'close' && was === false && now;
}
