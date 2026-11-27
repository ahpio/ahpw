/**
 * Whether a click on the pill for command `id` closes the list: only when the
 * list is open and that pill opened it. `opened` is the command of the pill
 * that opened the list, undefined once the person typed.
 */
export function pillCloses(opened: string | undefined, id: string, visible: boolean): boolean {
  return visible && opened === id;
}
