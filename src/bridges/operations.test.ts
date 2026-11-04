import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INVOKE_OPERATION, invokeOperation, listOperations, operationsReducer, rowOperations, type Operation, type OperationsState } from './operations.js';

const request = vi.hoisted(() => vi.fn());

vi.mock('./data.js', () => ({ hostBridge: () => ({ request }) }));

beforeEach(() => {
  request.mockReset();
});

const op = (id: string, kind: string, scopes: string[]): Operation => ({ id, kind, scopes, grant: 'g', status: 'idle' });

const TUNNEL_OPS: Operation[] = [
  op('devtunnel/create', 'devtunnel', ['list']),
  op('devtunnel/remove', 'devtunnel', ['tunnel']),
  op('cloudflare/create', 'cloudflare', ['list']),
  op('cloudflare/remove', 'cloudflare', ['tunnel']),
];

describe('a channel with operations', () => {
  it('folds added, changed, removed and operations', () => {
    const fold = operationsReducer('x-ahpd-tunnels');
    let state: OperationsState = { records: [], operations: [] };
    state = fold(state, { type: 'x-ahpd-tunnels/added', id: 'a', record: { id: 'a', status: 'stopped' } });
    state = fold(state, { type: 'x-ahpd-tunnels/changed', id: 'a', record: { id: 'a', status: 'running' } });
    state = fold(state, { type: 'x-ahpd-tunnels/added', id: 'b', record: { id: 'b' } });
    expect(state.records).toEqual([{ id: 'a', record: { id: 'a', status: 'running' } }, { id: 'b', record: { id: 'b' } }]);
    state = fold(state, { type: 'x-ahpd-tunnels/removed', id: 'a' });
    expect(state.records.map((one) => one.id)).toEqual(['b']);
    state = fold(state, { type: 'x-ahpd-tunnels/operations', operations: TUNNEL_OPS });
    expect(state.operations).toBe(TUNNEL_OPS);
    expect(state.records.map((one) => one.id)).toEqual(['b']);
  });

  it('leaves the state alone for another channel\'s action', () => {
    const fold = operationsReducer('x-ahpd-tunnels');
    const state: OperationsState = { records: [{ id: 'a', record: {} }], operations: [] };
    expect(fold(state, { type: 'x-ahpd-clients/removed', id: 'a' })).toBe(state);
    expect(fold(state, { type: 'x-ahpd-clients/operations', operations: TUNNEL_OPS })).toBe(state);
  });

  it('gives a row its kind\'s operations, and the list its list operations', () => {
    const state: OperationsState = { records: [], operations: TUNNEL_OPS };
    expect(listOperations(state).map((one) => one.id)).toEqual(['devtunnel/create', 'cloudflare/create']);
    expect(rowOperations(state, { id: 'a', kind: 'devtunnel' }).map((one) => one.id)).toEqual(['devtunnel/remove']);
  });

  it('gives a row with no kind every record operation', () => {
    const state: OperationsState = { records: [], operations: [op('drop', 'host', ['client'])] };
    expect(rowOperations(state, { id: '3', clientId: 'c' }).map((one) => one.id)).toEqual(['drop']);
    expect(listOperations(state)).toEqual([]);
    expect(rowOperations(undefined, {})).toEqual([]);
  });

  it('sends a target and an input only when given', async () => {
    request.mockResolvedValue({});
    const drop = op('drop', 'host', ['client']);
    await invokeOperation('h', 'x-ahpd-clients://', drop, '3');
    expect(request).toHaveBeenLastCalledWith(INVOKE_OPERATION, { channel: 'x-ahpd-clients://', operationId: 'drop', target: { id: '3' } });
    const create = op('devtunnel/create', 'devtunnel', ['list']);
    await invokeOperation('h', 'x-ahpd-tunnels://', create, undefined, { port: 1 });
    expect(request).toHaveBeenLastCalledWith(INVOKE_OPERATION, { channel: 'x-ahpd-tunnels://', operationId: 'devtunnel/create', input: { port: 1 } });
    await invokeOperation('h', 'x-ahpd-tunnels://', create);
    expect(request).toHaveBeenLastCalledWith(INVOKE_OPERATION, { channel: 'x-ahpd-tunnels://', operationId: 'devtunnel/create' });
  });
});
