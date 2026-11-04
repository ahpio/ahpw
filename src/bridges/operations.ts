/**
 * A records channel that lists `operations`, as ahpd's tunnels and clients
 * channels do, and the one command that runs them, `x-ahpd/invokeOperation`.
 *
 * The state is `{ records, operations }`: the records fold as any records
 * channel's do, and `<scheme>/operations` replaces the list. Each operation
 * names the scopes it runs on: `list` is the channel as a whole, any other
 * scope is one record, which an invocation names as `target: { id }`. A record
 * operation belongs to a `kind`; a record that has a `kind` takes only that
 * kind's operations, and a record with none takes them all.
 */

import { translate } from '@softov/scena';
import { confirm } from '../shell/notify/confirm.js';
import { failed } from '../shell/notify/say.js';
import { textOf } from './words.js';
import { hostBridge } from './data.js';
import { recordsReducer } from './people.js';

type Bag = Record<string, unknown>;

/** The command every channel with operations is served by. */
export const INVOKE_OPERATION = 'x-ahpd/invokeOperation';

/** How the last invocation of an operation went. */
export type OperationStatus = 'idle' | 'running' | 'error';

/** One operation as a channel lists it. */
export interface Operation {
  id: string;
  /** The `name` of the kind that declared it. */
  kind: string;
  label?: string;
  description?: string;
  icon?: string;
  /** The JSON Schema its input is drawn from; absent, it takes none. */
  input?: Bag;
  /** The question to ask first; its presence says the operation is destructive. */
  confirmation?: string;
  scopes: string[];
  grant: string;
  status: OperationStatus;
  error?: string;
}

export interface OperationsState<R = Bag> {
  records: { id: string; record: R }[];
  operations?: Operation[];
}

type OperationsAction<R> =
  | { type: string; id: string; record: R }
  | { type: string; id: string }
  | { type: string; operations: Operation[] };

/** Folds `<scheme>/added`, `/changed`, `/removed` and `/operations` into `{ records, operations }`. */
export function operationsReducer<R = Bag>(scheme: string): (state: OperationsState<R>, action: OperationsAction<R>) => OperationsState<R> {
  const records = recordsReducer<R>(scheme);
  return (state, action) => {
    if (action.type === `${scheme}/operations`) {
      return 'operations' in action && Array.isArray(action.operations) ? { ...state, operations: action.operations } : state;
    }
    if (!('id' in action)) return state;
    const folded = records({ records: state.records }, action);
    return folded.records === state.records ? state : { ...state, records: folded.records };
  };
}

/** What a person reads for an operation: its label, or its id when it has none. */
export const labelOf = (operation: Operation): string => operation.label ?? operation.id;

/** The operations that run on the channel as a whole. */
export function listOperations(state: OperationsState<unknown> | undefined): Operation[] {
  return (state?.operations ?? []).filter((one) => one.scopes.includes('list'));
}

/** The operations that run on one record: those of its `kind`, or every record operation when it has no `kind`. */
export function rowOperations(state: OperationsState<unknown> | undefined, record: unknown): Operation[] {
  const kind = typeof record === 'object' && record !== null ? (record as Bag).kind : undefined;
  return (state?.operations ?? []).filter((one) =>
    one.scopes.some((scope) => scope !== 'list') && (typeof kind !== 'string' || one.kind === kind));
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
