import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Scena } from '@softov/scena/types';
import type { Operation } from '../../bridges/operations.js';
import { nameOf, runOperation } from './run.js';

const { confirm, request } = vi.hoisted(() => ({ confirm: vi.fn(), request: vi.fn() }));

vi.mock('../../shell/notify/confirm.js', () => ({ confirm }));
vi.mock('../../shell/notify/say.js', () => ({ failed: vi.fn() }));
vi.mock('../../bridges/data.js', () => ({ hostBridge: () => ({ request }) }));

const scena = { store: { set: vi.fn() }, commands: { execute: vi.fn() } } as unknown as Scena;
const disable: Operation = { id: 'disable', kind: 'host', label: 'Disable', description: 'Turns the agent off.', scopes: ['agent'], grant: 'agent:put', status: 'idle' };
const remove: Operation = { ...disable, id: 'remove', label: 'Remove', confirmation: 'Remove this agent?' };
const place = { host: 'h', channel: 'x-ahpd-agents', target: 'claude', held: { name: 'Claude' } };

beforeEach(() => {
  confirm.mockReset();
  request.mockReset();
  request.mockResolvedValue({});
});

describe('runOperation', () => {
  it('asks before an operation with no question, by its label, the name and its description, and sends nothing on a no', async () => {
    confirm.mockResolvedValue(false);
    await runOperation(scena, place, disable);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ body: 'Turns the agent off.', confirmLabel: 'Disable', tone: 'default' }));
    expect(request).not.toHaveBeenCalled();
  });

  it('runs it on a yes', async () => {
    confirm.mockResolvedValue(true);
    await runOperation(scena, place, disable);
    expect(request).toHaveBeenCalledOnce();
  });

  it("asks the host's own question in the danger tone", async () => {
    confirm.mockResolvedValue(true);
    await runOperation(scena, place, remove);
    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ body: 'Remove this agent?', tone: 'danger' }));
  });

  it('opens the form of an operation with input, and asks nothing', async () => {
    await runOperation(scena, place, { ...disable, input: { type: 'object' } });
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe('nameOf', () => {
  it('calls a record by its title, its name, else its id, and a list operation by nothing', () => {
    expect(nameOf({ ...place, held: { title: 'GitHub', name: 'x' } })).toBe('GitHub');
    expect(nameOf(place)).toBe('Claude');
    expect(nameOf({ ...place, held: {} })).toBe('claude');
    expect(nameOf({ host: 'h', channel: 'c' })).toBeUndefined();
  });
});
