/**
 * A records channel that lists `operations`, as ahpd's tunnels and clients
 * channels do, and the one command that runs them, `x-ahpd/invokeOperation`.
 *
 * The state is `{ records, operations }`: the records fold as any records
 * channel's do, and `<scheme>/operations` replaces the list. Each operation
 * names the scopes it runs on: `list` is the channel as a whole, any other
 * scope is one record, which an invocation names as `target: { id }`. A record
 * operation belongs to a `kind`; a record that has a `kind` takes only that
 * kind's operations, and a record with none takes them all. A record that
 * lists `operations`, the ids it offers now, takes only those, so an enabled
 * record offers Disable and not Enable; a record from an older host lists none
 * and takes every operation of its kind.
 */

import { translate } from '@softov/scena';
import { confirm } from '../shell/notify/confirm.js';
import { failed } from '../shell/notify/say.js';
import { textOf } from './words.js';
import { hostBridge } from './data.js';
import type { Operation, OperationsState } from './operations-state.js';

export { operationsReducer, type Operation, type OperationsState, type OperationStatus } from './operations-state.js';

type Bag = Record<string, unknown>;

/** The command every channel with operations is served by. */
export const INVOKE_OPERATION = 'x-ahpd/invokeOperation';

/** What a person reads for an operation: its label, or its id when it has none. */
export const labelOf = (operation: Operation): string => operation.label ?? operation.id;

/** The operations that run on the channel as a whole. */
export function listOperations(state: OperationsState<unknown> | undefined): Operation[] {
  return (state?.operations ?? []).filter((one) => one.scopes.includes('list'));
}

/**
 * The operations that run on one record now: those of its `kind`, or every
 * record operation when it has no `kind`, and only the ids its `operations`
 * names when it names them.
 */
export function rowOperations(state: OperationsState<unknown> | undefined, record: unknown): Operation[] {
  const held = typeof record === 'object' && record !== null ? record as Bag : {};
  const kind = held.kind;
  const offered = Array.isArray(held.operations) ? held.operations.filter((one): one is string => typeof one === 'string') : undefined;
  return (state?.operations ?? []).filter((one) =>
    one.scopes.some((scope) => scope !== 'list')
    && (typeof kind !== 'string' || one.kind === kind)
    && (offered === undefined || offered.includes(one.id)));
}


/** The params `x-ahpd/invokeOperation` takes; a target and an input go only when given. */
export function invokeParams(channel: string, operation: Operation, target?: string, input?: Bag): Bag {
  return {
    channel,
    operationId: operation.id,
    ...(target === undefined ? {} : { target: { id: target } }),
    ...(input === undefined ? {} : { input }),
  };
}

/**
 * The input an operation's form starts from: what the record holds, and for
 * each required field it does not hold, the field's `default` or the one value
 * an enum of one allows. A form shows those values, so it sends them too.
 */
export function startingInput(schema: Bag, held: Bag): Bag {
  const fields = schema.properties !== null && typeof schema.properties === 'object' ? schema.properties as Record<string, Bag> : {};
  const required = Array.isArray(schema.required) ? schema.required.filter((name): name is string => typeof name === 'string') : [];
  const out: Bag = { ...held };
  for (const name of required) {
    if (out[name] !== undefined) continue;
    const field = fields[name] ?? {};
    if (field.default !== undefined) out[name] = field.default;
    else if (Array.isArray(field.enum) && field.enum.length === 1) out[name] = field.enum[0];
  }
  return out;
}

/** The id of the record an operation's answer names, or nothing. */
export function madeId(answer: unknown): string | undefined {
  const id = answer !== null && typeof answer === 'object' ? (answer as Bag).id : undefined;
  return typeof id === 'string' && id !== '' ? id : undefined;
}

/** Run one operation on the host; the host's answer, the record or `{}`. A refusal throws. */
export async function invokeOperation(host: string, channel: string, operation: Operation, target?: string, input?: Bag): Promise<unknown> {
  return await hostBridge(host).request(INVOKE_OPERATION as never, invokeParams(channel, operation, target, input) as never);
}

/** Ask the operation's own question, when it has one; true when there is none. */
export async function askFirst(operation: Operation): Promise<boolean> {
  const question = textOf(operation.confirmation);
  if (question === '') return true;
  return await confirm({ title: labelOf(operation), body: question, confirmLabel: labelOf(operation), tone: 'danger' });
}

/** Say a refusal of an operation, with the host's own words. */
export function sayRefused(operation: Operation, error: unknown): void {
  failed(translate('operations/failed', { label: labelOf(operation) }), error);
}
