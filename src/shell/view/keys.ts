import type { Disposable, Scena } from '@softov/scena/types';

/** Elements where a bare key is typing, not a shortcut. */
const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null;
  if (target === null) return false;
  return target.isContentEditable || TYPING_TAGS.has(target.tagName);
}

/**
 * Runs the command bound to a key. scena keeps the bindings a command's `keys`
 * declare but does not listen to the window; this does, on the page and on
 * each window a tab opens in. A key with Ctrl, Alt
 * or Meta is a shortcut even while typing; a bare key is not.
 */
export function attachKeys(scena: Scena): Disposable {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Control' || event.key === 'Shift' || event.key === 'Alt' || event.key === 'Meta') return;
    if (isTyping(event) && !(event.ctrlKey || event.metaKey || event.altKey)) return;
    const resolution = scena.keybindings.resolve({
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
    });
    if (resolution.kind === 'fire') {
      event.preventDefault();
      void scena.commands.executeFrom('keybinding', resolution.commandId, resolution.args?.[0]);
    } else if (resolution.kind === 'chord-pending') {
      event.preventDefault();
    }
  };
  // A tab dragged out into a window of its own gets its keys on that window,
  // so each window scena opens listens too, until it closes.
  const windows = new Set<Window>([window]);
  window.addEventListener('keydown', onKeyDown);
  const opened = scena.events.on('scena:window:opened', (raw) => {
    const { window: other } = raw as { window: Window };
    windows.add(other);
    other.addEventListener('keydown', onKeyDown);
  });
  const closed = scena.events.on('scena:window:closed', (raw) => {
    const { window: other } = raw as { window: Window };
    windows.delete(other);
    other.removeEventListener('keydown', onKeyDown);
  });
  return {
    dispose: () => {
      opened.dispose();
      closed.dispose();
      for (const one of windows) one.removeEventListener('keydown', onKeyDown);
    },
  };
}
