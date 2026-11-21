// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createScena } from '@softov/scena/core';
import { attachKeys } from './keys.js';

describe('attachKeys', () => {
  it('runs a bound command from a key in a window a tab opened in, until it closes', () => {
    const scena = createScena();
    const run = vi.fn();
    scena.commands.register({ id: 'go', title: 'Go', keys: 'ctrl+k', run });
    const keys = attachKeys(scena);
    // A same-origin iframe stands for the window scena opens.
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const other = frame.contentWindow as Window;
    const press = () => other.document.body.dispatchEvent(new (other as Window & typeof globalThis).KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));

    press();
    expect(run).not.toHaveBeenCalled();
    scena.events.emit('scena:window:opened', { surface: 'window:1', window: other });
    press();
    expect(run).toHaveBeenCalledTimes(1);
    scena.events.emit('scena:window:closed', { surface: 'window:1', window: other });
    press();
    expect(run).toHaveBeenCalledTimes(1);
    keys.dispose();
    frame.remove();
  });
});
