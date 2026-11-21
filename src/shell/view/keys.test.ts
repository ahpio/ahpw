// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ScenaProvider, SurfaceWindows } from '@softov/scena/react';
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

  it('runs a bound command from a key in a window open before it started, as after a reload', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const scena = createScena();
    const run = vi.fn();
    scena.commands.register({ id: 'go', title: 'Go', keys: 'ctrl+k', run });
    // scena opens the window of a window surface; an iframe stands for it.
    const frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const other = frame.contentWindow as Window;
    const open = vi.spyOn(window, 'open').mockReturnValue(other);
    scena.layout.setSurface('window:1', { visible: true, layout: 'tab-panel', window: { left: 0, top: 0, width: 400, height: 300 } });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => {
      root.render(createElement(ScenaProvider, { scena, children: createElement(SurfaceWindows) }));
    });
    expect(open).toHaveBeenCalled();

    const keys = attachKeys(scena);
    other.document.body.dispatchEvent(new (other as Window & typeof globalThis).KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
    expect(run).toHaveBeenCalledTimes(1);

    keys.dispose();
    await act(async () => root.unmount());
    open.mockRestore();
    frame.remove();
    host.remove();
  });
});
