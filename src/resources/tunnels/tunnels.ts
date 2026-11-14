/**
 * A host's tunnels, as ahpd's `x-ahpd-tunnels://` lists them: one row for each
 * stored tunnel, with the `status` its kind last reported, its `url` and
 * `error` where the host knows them, and the `operation` running on it. The
 * fields the host keeps are named here; every other field is one of the kind's
 * settings, and a secret among them reads `{ "$secret": "<name>" }`.
 */

import type { Dot } from '../../shell/explorer/ExplorerList.js';
import { operationsReducer, type OperationsState, type OperationStatus } from '../../bridges/operations.js';

type Bag = Record<string, unknown>;

export const TUNNELS_SCHEME = 'x-ahpd-tunnels';
export const TUNNELS = `${TUNNELS_SCHEME}://`;

export type TunnelsState = OperationsState;

/** Folds the channel's records and its operations. */
export const tunnelsReducer = operationsReducer(TUNNELS_SCHEME);

export type TunnelStatus = 'running' | 'stopped' | 'error';

/** The fields that are not one of the kind's settings. */
const HOST_FIELDS: ReadonlySet<string> = new Set(['id', 'kind', 'plugin', 'purpose', 'enabled', 'owner', 'status', 'url', 'error', 'operation', 'operations']);

/** What a row says, as the host sent it. */
export interface TunnelFacts {
  kind: string;
  status: TunnelStatus;
  enabled: boolean;
  /** `system` for the one a kind asks the host to keep, `person` for one a person made. */
  purpose?: string;
  /** The plugin that registers its kind. */
  plugin?: string;
  url?: string;
  error?: string;
  /** The operation running on it, or the last one, with its error. */
  operation?: { id: string; status: OperationStatus; error?: string };
  /** The kind's settings, a secret as its reference. */
  settings: Bag;
}

const text = (value: unknown): string | undefined => (typeof value === 'string' && value !== '' ? value : undefined);

export function factsOf(record: Bag): TunnelFacts {
  const status = record.status === 'running' || record.status === 'error' ? record.status : 'stopped';
  const operation = typeof record.operation === 'object' && record.operation !== null ? (record.operation as TunnelFacts['operation']) : undefined;
  const purpose = text(record.purpose);
  const plugin = text(record.plugin);
  const url = text(record.url);
  const error = text(record.error);
  return {
    kind: text(record.kind) ?? '',
    status,
    enabled: record.enabled !== false,
    ...(purpose === undefined ? {} : { purpose }),
    ...(plugin === undefined ? {} : { plugin }),
    ...(url === undefined ? {} : { url }),
    ...(error === undefined ? {} : { error }),
    ...(operation === undefined ? {} : { operation }),
    settings: Object.fromEntries(Object.entries(record).filter(([field]) => !HOST_FIELDS.has(field))),
  };
}

/** The schema a kind's settings follow: the input of its `<kind>/create` operation, which every kind has. */
export function kindSchema(state: OperationsState | undefined, kind: string): Bag | undefined {
  return state?.operations?.find((one) => one.id === `${kind}/create`)?.input;
}

/** One setting as the page lists it. */
export interface SettingRow {
  field: string;
  /** The schema's title for it, else its field name. */
  label: string;
  /** What the record holds, else the schema's default; undefined when neither says. */
  value: unknown;
}

/**
 * The settings the page lists: each field the kind's schema names, in its
 * order, held or not, so a field left at its default still shows. With no
 * schema, every setting the record holds, by field name.
 */
export function settingRows(schema: Bag | undefined, settings: Bag): SettingRow[] {
  const fields = schema?.properties !== null && typeof schema?.properties === 'object' ? schema.properties as Record<string, Bag> : undefined;
  if (fields === undefined) return Object.entries(settings).map(([field, value]) => ({ field, label: field, value }));
  return Object.entries(fields).map(([field, def]) => ({
    field,
    label: typeof def.title === 'string' && def.title !== '' ? def.title : field,
    value: settings[field] ?? def.default,
  }));
}

/** Whether an operation is running on the tunnel now. */
export const busy = (facts: TunnelFacts): boolean => facts.operation?.status === 'running';

/** The row's dot: a running operation first, then the kind's status. */
export function dotOf(facts: TunnelFacts): Dot {
  if (busy(facts)) return 'working';
  if (facts.status === 'running') return 'ok';
  if (facts.status === 'error') return 'failed';
  return 'off';
}

/** The word for the dot, as a catalog key under `tunnels/status/`. */
export function statusKey(facts: TunnelFacts): 'busy' | 'running' | 'error' | 'stopped' | 'disabled' {
  if (busy(facts)) return 'busy';
  if (facts.status === 'stopped' && !facts.enabled) return 'disabled';
  return facts.status;
}

/** The row's line after its kind: the error, else the URL, else the status word. */
export function detailOf(facts: TunnelFacts, statusWord: string): string {
  return facts.error ?? facts.url ?? statusWord;
}
