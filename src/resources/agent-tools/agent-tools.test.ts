import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scena } from '@softov/scena/types';

const held = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (key: string) => held.get(key) ?? null, setItem: (key: string, value: string) => { held.set(key, value); }, removeItem: (key: string) => { held.delete(key); } });
const windowListeners = new Map<string, (event: unknown) => void>();
vi.stubGlobal('window', { addEventListener: (name: string, fn: (event: unknown) => void) => windowListeners.set(name, fn), removeEventListener: () => undefined, location: { host: 'localhost', search: '', hash: '' }, localStorage, matchMedia: () => ({ matches: false, addEventListener: () => undefined }), setTimeout });

const { createScena } = await import('@softov/scena');
const { marks, modeOf, registerAgentTools, serveAsTool, setMode, toolSettings } = await import('./registry.js');
const { check } = await import('./check.js');
const { runTool } = await import('./tools.js');
const { announcement } = await import('./announce.js');
const { applyLayout } = await import('../../shell/layout-menu.js');
const { THEME_ID_PATH } = await import('@softov/scena/styles');
// Loaded here: a case's time limit does not count the load of a whole page.
const { registerManage } = await import('../../shell/manage.js');
await Promise.all([import('../files/index.js'), import('../sessions/index.js'), import('../terminals/index.js'), import('../host/index.js')]);

let scena: Scena;
const ran = vi.fn();
const text = (result: { content?: unknown }): string => (result.content as { text: string }[])[0]!.text;

beforeEach(() => {
  held.clear();
  ran.mockReset();
  scena = createScena();
  serveAsTool({ id: 'test.open', order: 0, text: 'Open it.', input: () => ({ type: 'object', properties: { uri: { type: 'string' }, host: { type: 'string' } }, required: ['uri'] }) });
  scena.commands.register({ id: 'test.open', title: 'Open', run: (_ctx, args) => ran(args) });
  scena.commands.register({ id: 'test.unmarked', title: 'No', run: ran });
});

describe('check', () => {
  const schema = { type: 'object' as const, properties: { a: { type: 'string' as const, enum: ['x', 'y'] }, n: { type: 'integer' as const } }, required: ['a'] };

  it('takes what fits, and names the field that does not', () => {
    expect(check(schema, { a: 'x', n: 2 })).toBeUndefined();
    expect(check(schema, {})).toBe('a: required');
    expect(check(schema, { a: 'z' })).toBe('a: expected x | y');
    expect(check(schema, { a: 'x', n: 1.5 })).toBe('n: expected integer');
    expect(check(schema, { a: 'x', wrong: 1 })).toBe('wrong: unknown field');
    expect(check(schema, { a: 'x', toString: 1 })).toBe('toString: unknown field');
    expect(check(schema, 'x')).toBe('args: not an object');
  });
});

describe('modes', () => {
  it('start off, every one', () => {
    expect(toolSettings().length).toBeGreaterThan(0);
    for (const one of toolSettings()) expect(one.read(scena)).toBe('off');
  });

  it('follow a change made in another window', () => {
    const registered = registerAgentTools(scena);
    windowListeners.get('storage')!({ key: 'ahpw.agentTools.test.open', newValue: 'run' });
    expect(modeOf(scena, 'test.open')).toBe('run');
    windowListeners.get('storage')!({ key: 'ahpw.agentTools.test.open', newValue: 'off' });
    expect(modeOf(scena, 'test.open')).toBe('off');
    registered.dispose();
  });
});

describe('runTool', () => {
  it('lists only what is on', async () => {
    expect(JSON.parse(text(await runTool(scena, 'a', 'listCommands', {})))).toEqual([]);
    setMode(scena, 'test.open', 'notify');
    expect(JSON.parse(text(await runTool(scena, 'a', 'listCommands', {})))).toMatchObject([{ id: 'test.open', description: 'Open it.' }]);
  });

  it('refuses a command that is off or has no mark', async () => {
    expect((await runTool(scena, 'a', 'runCommand', { id: 'test.open', args: { uri: 'u' } })).success).toBe(false);
    expect((await runTool(scena, 'a', 'runCommand', { id: 'test.unmarked' })).success).toBe(false);
    expect(ran).not.toHaveBeenCalled();
  });

  it('refuses a wrong argument by name, and runs nothing', async () => {
    setMode(scena, 'test.open', 'run');
    expect(await runTool(scena, 'a', 'runCommand', { id: 'test.open' })).toMatchObject({ success: false, error: { message: 'uri: required' } });
    expect(ran).not.toHaveBeenCalled();
  });

  it('fills in the host of the session that called', async () => {
    setMode(scena, 'test.open', 'run');
    expect((await runTool(scena, 'a', 'runCommand', { id: 'test.open', args: { uri: 'u' } })).success).toBe(true);
    await runTool(scena, 'a', 'runCommand', { id: 'test.open', args: { uri: 'u', host: 'b' } });
    expect(ran.mock.calls).toEqual([[{ uri: 'u', host: 'a' }], [{ uri: 'u', host: 'b' }]]);
  });

  it('answers a command that throws with a failure', async () => {
    setMode(scena, 'test.open', 'run');
    ran.mockImplementation(() => { throw new Error('broke'); });
    expect(await runTool(scena, 'a', 'runCommand', { id: 'test.open', args: { uri: 'u' } })).toMatchObject({ success: false, error: { message: 'broke' } });
  });
});

describe('announcement', () => {
  const session = (ids: string[]) => ({ activeClients: ids.map((clientId) => ({ clientId, tools: [] })) }) as never;

  it('gives the two tools while one command is on', () => {
    expect(announcement('me', true, session([]))).toMatchObject({ type: 'session/activeClientSet', activeClient: { clientId: 'me', tools: [{ name: 'listCommands' }, { name: 'runCommand' }] } });
  });

  it('says nothing while every command is off, and leaves a session that still lists it', () => {
    expect(announcement('me', false, session(['other']))).toBeUndefined();
    expect(announcement('me', false, session(['me']))).toMatchObject({ type: 'session/activeClientRemoved', clientId: 'me' });
  });
});

describe('the marked commands', () => {
  it('are the ten, each with a schema the check reads', () => {
    const samples: Record<string, Record<string, unknown>> = {
      'ahp.openSession': { resource: 'ahp-session:/1' },
      'ahp.newSession': {},
      'ahp.openFile': { uri: 'file:///a', line: 3 },
      'ahp.openDiff': { file: 'file:///a' },
      'ahp.openTerminal': { uri: 'ahp-terminal:/1' },
      'ahp.newTerminal': { cwd: 'file:///a' },
      'ahp.manage.layout': { mode: 'focus' },
      'ahp.manage.theme': { theme: 'default' },
      'ahp.openSettings': {},
      'ahp.openInterfaceSettings': {},
    };
    const real = marks().filter((mark) => mark.id.startsWith('ahp.'));
    expect(real.map((mark) => mark.id)).toEqual(Object.keys(samples));
    for (const mark of real) expect([mark.id, check(mark.input(), samples[mark.id])]).toEqual([mark.id, undefined]);
  });

  it('apply a layout choice, and leave the menu to a call with none', async () => {
    expect(await applyLayout(scena, { mode: 'focus' })).toBe(true);
    expect(scena.layout.get().surfaces.activitybar?.visible).toBe(false);
    expect(await applyLayout(scena, {})).toBe(false);
    expect(await applyLayout(scena, undefined)).toBe(false);
  });

  it('set a theme with no menu', async () => {
    registerManage(scena, false);
    await scena.commands.execute('ahp.manage.theme', { theme: 'default' });
    expect(scena.store.get(THEME_ID_PATH)).toBe('default');
  });
});
