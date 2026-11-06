/**
 * A view a plugin draws, as ahpd sends it on a plugin row, a connector row and
 * an agent row: one structure, by surface, with its A2UI data model. A
 * `<scheme>/viewData` action sets one value of a view's data model without
 * the row being sent again.
 */

/** Where a prop reads its value: a JSON Pointer into the view's `dataModel`. */
export interface ViewBinding {
  path: string;
}

/** A list that repeats one component for each item at `path` in the data model. */
export interface ViewChildList {
  path: string;
  componentId: string;
}

/**
 * One component of a view, in A2UI v0.10's shape: its kind, the ids below it
 * or a list over a path, a Button's `action`, and the kind's own properties,
 * each a literal or a `{ path }` into the data model.
 */
export interface PluginViewComponent {
  id: string;
  component: string;
  child?: string;
  children?: string[] | ViewChildList;
  /** What a Button asks the host for: `name` is an `x-` method of the plugin, `context` its params. */
  action?: { event: { name: string; context?: Record<string, unknown> } };
  [prop: string]: unknown;
}

/** A view drawn on one surface: the component drawn first, every component by its id, and the data its bindings read. */
export interface PluginView {
  root: string;
  components: Record<string, PluginViewComponent>;
  dataModel?: Record<string, unknown>;
}

/** A row that shows views, by surface; `main` is its page. */
export interface ShowsViews {
  views?: Record<string, PluginView>;
}

/** What `<scheme>/viewData` carries: the record, its surface, and the value set at a path of that view's data model. */
export interface ViewData {
  id: string;
  surface: string;
  path: string;
  value: unknown;
}

/** The segments of a JSON Pointer, `~1` and `~0` read back; undefined when it does not start with `/`. */
function segmentsOf(path: string): string[] | undefined {
  if (!path.startsWith('/')) return undefined;
  if (path === '/') return [];
  return path.slice(1).split('/').map((one) => one.replace(/~1/g, '/').replace(/~0/g, '~'));
}

/** `into` with `value` at `segments`, copied on the way down; a missing step becomes an object. */
function placed(into: unknown, segments: readonly string[], value: unknown): unknown {
  if (segments.length === 0) return value;
  const [head, ...rest] = segments as [string, ...string[]];
  if (Array.isArray(into)) {
    const at = Number(head);
    if (!Number.isInteger(at) || at < 0) return into;
    const out = [...into];
    out[at] = placed(into[at], rest, value);
    return out;
  }
  const base = typeof into === 'object' && into !== null ? into as Record<string, unknown> : {};
  return { ...base, [head]: placed(base[head], rest, value) };
}

/**
 * The data model with `value` at `path`. A path of `/` replaces the whole
 * model, and then only an object is taken. A path that is not a pointer
 * leaves the model as it was.
 */
export function setViewData(model: Record<string, unknown> | undefined, path: string, value: unknown): Record<string, unknown> | undefined {
  const segments = segmentsOf(path);
  if (segments === undefined) return model;
  if (segments.length === 0) return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : model;
  return placed(model ?? {}, segments, value) as Record<string, unknown>;
}

/** The row with a `viewData` applied; a row with no view on that surface is left as it was. */
export function withViewData<R>(row: R, data: ViewData): R {
  const views = (row as ShowsViews).views;
  const view = views?.[data.surface];
  if (view === undefined) return row;
  const dataModel = setViewData(view.dataModel, data.path, data.value);
  if (dataModel === view.dataModel) return row;
  return { ...row, views: { ...views, [data.surface]: { ...view, ...(dataModel === undefined ? {} : { dataModel }) } } };
}
