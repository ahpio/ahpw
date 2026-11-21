import { describe, expect, it } from 'vitest';
import { createScena } from '@softov/scena/core';
import type { DroppedThing } from '@softov/scena/types';
import { ahpPaths } from '../../bridges/data.js';
import { FILE_KIND } from '../files/viewers.js';
import { asAttachment, pastedFiles } from './composer-drop.js';

const files = (count: number) => ({ length: count }) as unknown as FileList;

describe('pastedFiles', () => {
  it('takes the files of a screenshot or a copied file', () => {
    const list = files(1);
    expect(pastedFiles({ types: ['Files'], files: list })).toBe(list);
  });

  it('leaves text to paste as text, even with a picture of it beside', () => {
    expect(pastedFiles({ types: ['text/plain', 'text/html', 'Files'], files: files(1) })).toBeNull();
    expect(pastedFiles({ types: ['text/plain'], files: files(0) })).toBeNull();
  });
});

describe('asAttachment', () => {
  const setup = () => {
    const scena = createScena();
    scena.components.register({ component: 'FilePage', category: 'page', renderer: { kind: 'react', load: async () => ({ default: () => null }) }, opens: { resourceKinds: [FILE_KIND] } });
    scena.store.set(ahpPaths('h').sessions, [{ resource: 'ahp-session://a', title: 'Refine', defaultChat: 'ahp-chat://a' }]);
    return scena;
  };
  const session = (host: string, resource: string, from: DroppedThing['from'] = 'row'): DroppedThing =>
    ({ from, key: `session:${host}:${resource}`, resource: { component: 'SessionPage', host, resource } });
  const fileTab: DroppedThing = { from: 'tab', key: 'file:h:FilePage:/repo/README.md', resource: { component: 'FilePage', host: 'h', uri: '/repo/README.md' }, surface: 'main' };

  it('makes a session of its host a chat reference, as a row or a tab', () => {
    const scena = setup();
    expect(asAttachment(scena, session('h', 'ahp-session://a'), 'h', 'ahp-session://me')).toEqual({ kind: 'session', attachment: { type: 'chat', label: 'Refine', resource: 'ahp-chat://a' } });
    expect(asAttachment(scena, session('h', 'ahp-session://a', 'tab'), 'h', undefined)?.kind).toBe('session');
  });

  it('makes a file tab of its host a file attachment', () => {
    const scena = setup();
    expect(asAttachment(scena, fileTab, 'h', undefined)).toMatchObject({ kind: 'file', uri: '/repo/README.md', attachment: { uri: '/repo/README.md' } });
  });

  it('passes on its own session, another host, an unknown session and another tab', () => {
    const scena = setup();
    expect(asAttachment(scena, session('h', 'ahp-session://a'), 'h', 'ahp-session://a')).toBeNull();
    expect(asAttachment(scena, session('other', 'ahp-session://a'), 'h', undefined)).toBeNull();
    expect(asAttachment(scena, session('h', 'ahp-session://gone'), 'h', undefined)).toBeNull();
    expect(asAttachment(scena, { ...fileTab, key: 'file:other:FilePage:/repo/README.md' }, 'h', undefined)).toBeNull();
    expect(asAttachment(scena, { from: 'tab', key: 'agent:h:claude', resource: { component: 'AgentPage' }, surface: 'main' }, 'h', undefined)).toBeNull();
  });
});
