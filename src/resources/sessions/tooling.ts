import type { ChildCustomization, Customization, CustomizationEnablement, McpServerCustomization, SessionActiveClient, SessionState, ToolDefinition } from '@microsoft/agent-host-protocol';
import { translate } from '@softov/scena';
import { counted, enabledOf, fileSpotOf, shortPath, stateOf, type FileSpot, type StateWord } from '../agents/words.js';

/** The tools of one source: the host's own, or one client's. */
export interface ToolGroup {
  /** `host`, or `client:<clientId>`. */
  key: string;
  title: string;
  tools: ToolDefinition[];
}

/** One input of a tool, as its open row lists it. */
export interface ToolParam {
  name: string;
  /** Its JSON Schema type, `string[]` for an array of strings; empty when the schema names none. */
  type: string;
  required: boolean;
  description: string;
}

/** A client's name: the one it sent, else the start of its id. */
export function clientName(client: SessionActiveClient): string {
  return client.displayName !== undefined && client.displayName !== '' ? client.displayName : translate('sessions/clients/unnamed', { id: client.clientId.slice(0, 8) });
}

/** The session's clients other than this window, which is `own`. */
export function otherClients(session: SessionState | undefined, own: string | undefined): SessionActiveClient[] {
  return (session?.activeClients ?? []).filter((client) => client.clientId !== own);
}

/** The session's tools by source: the host's first, then each client's, in the order the host lists them. A source with no tools has no group. */
export function toolGroups(session: SessionState | undefined): ToolGroup[] {
  const groups: ToolGroup[] = [];
  const host = session?.serverTools ?? [];
  if (host.length > 0) groups.push({ key: 'host', title: translate('sessions/tooling/host'), tools: host });
  for (const client of session?.activeClients ?? []) {
    if (client.tools.length > 0) groups.push({ key: `client:${client.clientId}`, title: clientName(client), tools: client.tools });
  }
  return groups;
}

/** The groups with only the tools whose name, title or description holds `query`, in any case; a group left empty goes. */
export function searchTools(groups: readonly ToolGroup[], query: string): ToolGroup[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...groups];
  const hit = (tool: ToolDefinition): boolean => [tool.name, tool.title, tool.description].some((text) => text?.toLowerCase().includes(needle) === true);
  return groups.map((group) => ({ ...group, tools: group.tools.filter(hit) })).filter((group) => group.tools.length > 0);
}

/** A schema's type as a word: its `type`, or `<items>[]` for an array. */
function typeOf(schema: Record<string, unknown>): string {
  const type = schema.type;
  if (type === 'array') {
    const items = schema.items;
    const inner = typeof items === 'object' && items !== null ? typeOf(items as Record<string, unknown>) : '';
    return inner === '' ? 'array' : `${inner}[]`;
  }
  if (Array.isArray(type)) return type.join(' | ');
  return typeof type === 'string' ? type : '';
}

/** A tool's inputs, in the order its schema lists them. */
export function toolParams(tool: ToolDefinition): ToolParam[] {
  const schema = tool.inputSchema;
  const required = new Set(schema?.required ?? []);
  return Object.entries(schema?.properties ?? {}).map(([name, value]) => {
    const prop = value as Record<string, unknown>;
    return { name, type: typeOf(prop), required: required.has(name), description: typeof prop.description === 'string' ? prop.description : '' };
  });
}

/** What a tool's hints say, only those the host set: read only, or whether it changes and destroys, and whether it reaches outside. */
export function toolHints(tool: ToolDefinition): string[] {
  const hints = tool.annotations;
  if (hints === undefined) return [];
  const out: string[] = [];
  if (hints.readOnlyHint === true) out.push(translate('sessions/tooling/hints/readOnly'));
  if (hints.readOnlyHint === false) out.push(translate('sessions/tooling/hints/changes'));
  if (hints.readOnlyHint !== true && hints.destructiveHint === true) out.push(translate('sessions/tooling/hints/destructive'));
  if (hints.readOnlyHint !== true && hints.destructiveHint === false) out.push(translate('sessions/tooling/hints/notDestructive'));
  if (hints.openWorldHint === true) out.push(translate('sessions/tooling/hints/openWorld'));
  return out;
}

/** The scopes an enablement decision is made at, the most specific first. */
export type Scope = 'session' | 'workspace' | 'global';

export const SCOPES: readonly Scope[] = ['session', 'workspace', 'global'];

/** One MCP server or plugin a view lists, with what its switch and menu need. */
export interface ToggleRow {
  id: string;
  name: string;
  enabled: boolean;
  /** The scope of the decision that holds, when there is one. */
  decidedAt?: Scope;
  /** Every decision the host sent, which a toggle sends back with one scope changed. */
  enablement: CustomizationEnablement[];
  state?: StateWord;
  /** The second line: where it is declared, or what it holds. */
  line: string;
  /** The file it is declared in, which "Show configuration" opens. */
  open?: FileSpot;
}

/** An MCP server row, with its lifecycle. */
export interface ServerRow extends ToggleRow {
  /** `ready`, `starting`, `stopped`, `error`, `authRequired`, or another the host sends. */
  lifecycle: string;
}

/** Rows of one source: the host's own servers, or one plugin's. */
export interface RowGroup<R> {
  key: string;
  title: string;
  /** What the heading says after the title: "plugin" for a plugin's servers. */
  note: string;
  rows: R[];
}

/** The rows whose name holds `query`, in any case; a group left empty goes. */
export function searchRows<R extends { name: string }>(groups: readonly RowGroup<R>[], query: string): RowGroup<R>[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') return [...groups];
  return groups.map((group) => ({ ...group, rows: group.rows.filter((row) => row.name.toLowerCase().includes(needle)) })).filter((group) => group.rows.length > 0);
}

/** The uri scheme agent-claude gives a server no file it reads declares. */
const INTERNAL = 'claude-internal:';

const enablementOf = (item: Customization | ChildCustomization): CustomizationEnablement[] => (item as { enablement?: CustomizationEnablement[] }).enablement ?? [];

const decidedAt = (enablement: readonly CustomizationEnablement[]): Scope | undefined => {
  const kind = enablement[0]?.kind as string | undefined;
  return kind === undefined ? undefined : (SCOPES as readonly string[]).includes(kind) ? kind as Scope : undefined;
};

function serverRow(server: McpServerCustomization): ServerRow {
  const enablement = enablementOf(server);
  const scope = decidedAt(enablement);
  const state = stateOf(server);
  const open = fileSpotOf(server);
  return {
    id: server.id,
    name: server.name,
    enabled: enabledOf(server),
    ...(scope === undefined ? {} : { decidedAt: scope }),
    enablement,
    ...(state === undefined ? {} : { state }),
    lifecycle: String(server.state.kind),
    line: server.uri.startsWith(INTERNAL) ? translate('sessions/tooling/claudeCli') : shortPath(server.uri),
    ...(open === undefined ? {} : { open }),
  };
}

const childrenOf = (item: Customization): ChildCustomization[] => (item as { children?: ChildCustomization[] }).children ?? [];

/** The session's MCP servers: the host's own first, then each plugin's or folder's, in host order. */
export function serverGroups(items: readonly Customization[] | undefined): RowGroup<ServerRow>[] {
  const list = items ?? [];
  const groups: RowGroup<ServerRow>[] = [];
  const own = list.filter((one) => String(one.type) === 'mcpServer') as McpServerCustomization[];
  if (own.length > 0) groups.push({ key: 'host', title: translate('sessions/tooling/host'), note: '', rows: own.map(serverRow) });
  for (const item of list) {
    const servers = childrenOf(item).filter((child) => String(child.type) === 'mcpServer') as McpServerCustomization[];
    if (servers.length === 0) continue;
    groups.push({ key: item.id, title: item.name, note: String(item.type) === 'plugin' ? translate('sessions/tooling/pluginNote') : '', rows: servers.map(serverRow) });
  }
  return groups;
}

/** What a plugin holds, in words; nothing before the host has read it. */
function holds(item: Customization): string {
  const children = (item as { children?: ChildCustomization[] }).children;
  if (children === undefined) return '';
  if (children.length === 0) return translate('agents/counts/empty');
  const types = new Map<string, number>();
  for (const child of children) types.set(String(child.type), (types.get(String(child.type)) ?? 0) + 1);
  return [...types].map(([type, count]) => counted(count, type)).join(' \u{00B7} ');
}

/** The session's plugins by the client that sent them, the host's own first; `clients` names each client. */
export function pluginGroups(items: readonly Customization[] | undefined, clients: readonly SessionActiveClient[]): RowGroup<ToggleRow>[] {
  const groups = new Map<string, RowGroup<ToggleRow>>();
  for (const item of items ?? []) {
    if (String(item.type) !== 'plugin') continue;
    const from = (item as { clientId?: string }).clientId;
    const key = from === undefined ? 'host' : `client:${from}`;
    let group = groups.get(key);
    if (group === undefined) {
      const client = clients.find((one) => one.clientId === from);
      const title = from === undefined ? translate('sessions/tooling/host') : client === undefined ? translate('sessions/clients/unnamed', { id: from.slice(0, 8) }) : clientName(client);
      group = { key, title, note: '', rows: [] };
      groups.set(key, group);
    }
    const enablement = enablementOf(item);
    const scope = decidedAt(enablement);
    const state = stateOf(item);
    group.rows.push({
      id: item.id,
      name: item.name,
      enabled: enabledOf(item),
      ...(scope === undefined ? {} : { decidedAt: scope }),
      enablement,
      ...(state === undefined ? {} : { state }),
      line: holds(item),
    });
  }
  const all = [...groups.values()];
  return [...all.filter((group) => group.key === 'host'), ...all.filter((group) => group.key !== 'host')];
}

/** Whether a row is on at `scope`: the decision made there, else what holds now. */
export function onAt(row: ToggleRow, scope: Scope): boolean {
  return row.enablement.find((entry) => (entry.kind as string) === scope)?.enabled ?? row.enabled;
}

/**
 * The decisions with the one at `scope` set to `enabled`, the others kept,
 * most specific first as the protocol asks. A folder decision names `folder`,
 * the session's working directory; with no folder there is no folder decision.
 */
export function withDecision(enablement: readonly CustomizationEnablement[], scope: Scope, enabled: boolean, folder: string | undefined): CustomizationEnablement[] {
  const kept = enablement.filter((entry) => (entry.kind as string) !== scope);
  const made = scope === 'workspace'
    ? (folder === undefined ? undefined : { kind: 'workspace', uri: folder, enabled })
    : { kind: scope, enabled };
  const all = made === undefined ? kept : [...kept, made as CustomizationEnablement];
  const rank = (entry: CustomizationEnablement): number => {
    const at = (SCOPES as readonly string[]).indexOf(entry.kind as string);
    return at < 0 ? SCOPES.length : at;
  };
  return [...all].sort((a, b) => rank(a) - rank(b));
}

/** What a row's state line says about its switch: "Off (Session)", or nothing when it is on. */
export function offWord(row: ToggleRow): string {
  if (row.enabled) return '';
  return row.decidedAt === undefined ? translate('sessions/tooling/off') : translate('sessions/tooling/offAt', { scope: translate(`sessions/tooling/scopes/${row.decidedAt}`) });
}
