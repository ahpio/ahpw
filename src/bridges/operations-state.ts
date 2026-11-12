/**
 * The state of a records channel that lists `operations`, and the reducer
 * that folds it. Kept apart from the command that runs an operation, so a
 * bridge can build its reducer without loading the host connection.
 */

import { recordsReducer } from './people.js';
import type { ViewData } from './views.js';

type Bag = Record<string, unknown>;

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
  | ({ type: string } & ViewData)
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
