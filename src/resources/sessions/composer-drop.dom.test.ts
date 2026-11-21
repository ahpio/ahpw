// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import type { MessageAttachment } from '@microsoft/agent-host-protocol';
import { createScena } from '@softov/scena/core';
import { ScenaProvider, startOpenDrag } from '@softov/scena/react';
import { ahpPaths } from '../../bridges/data.js';
import { useComposerDrop } from './composer-drop.js';

// A row's drag, as the session explorer starts it, and the event a drop hands the box.
function rowDrop(shiftKey: boolean) {
  const data = new Map<string, string>();
  const dataTransfer = { types: [] as string[], effectAllowed: 'all', dropEffect: 'none', files: [] as unknown as FileList, setData: (type: string, value: string) => { data.set(type, value); dataTransfer.types = [...data.keys()]; }, getData: (type: string) => data.get(type) ?? '' };
  startOpenDrag(dataTransfer, { key: 'session:h:ahp-session://a', resource: { component: 'SessionPage', host: 'h', resource: 'ahp-session://a' } });
  let stopped = false;
  return { dataTransfer, shiftKey, preventDefault: () => {}, stopPropagation: () => { stopped = true; }, isPropagationStopped: () => stopped };
}

describe('a session dropped on the composer', () => {
  it('attaches a chat reference, and with Shift also writes its title in as a token', async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    const scena = createScena();
    scena.store.set(ahpPaths('h').sessions, [{ resource: 'ahp-session://a', title: 'Refine', defaultChat: 'ahp-chat://a' }]);
    const attach = vi.fn<(attachment: MessageAttachment) => void>();
    const insert = vi.fn<(words: string) => void>();
    let drop: ReturnType<typeof useComposerDrop> | undefined;
    const Box = () => {
      drop = useComposerDrop({ host: 'h', attach, insert, upload: () => {} });
      return null;
    };
    const host = document.createElement('div');
    const root = createRoot(host);
    await act(async () => root.render(createElement(ScenaProvider, { scena, children: createElement(Box) })));

    await act(async () => drop!.props.onDrop(rowDrop(false) as never));
    expect(insert).not.toHaveBeenCalled();
    expect(attach).toHaveBeenLastCalledWith({ type: 'chat', label: 'Refine', resource: 'ahp-chat://a' });

    await act(async () => drop!.props.onDrop(rowDrop(true) as never));
    expect(insert).toHaveBeenCalledWith('@Refine ');
    expect(attach).toHaveBeenLastCalledWith({ type: 'chat', label: 'Refine', resource: 'ahp-chat://a', _meta: { token: '@Refine' } });

    await act(async () => root.unmount());
  });
});
