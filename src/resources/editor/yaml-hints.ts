/**
 * Completions for a form's YAML text, from the form's JSON Schema: the keys
 * allowed where the cursor is, and the values a field allows. It reads the
 * block style a form's YAML is written in, by indentation; flow style and
 * multi-line scalars get no hints.
 */

import { insertCompletionText, startCompletion, type Completion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete';
import type { EditorView } from '@codemirror/view';
import { stringify } from 'yaml';

type Schema = Record<string, unknown>;

/** Where the cursor is: the path of keys to its mapping, and whether it types a key or a value. */
export interface YamlPlace {
  /** The keys from the root to the mapping the cursor is in; `[]` steps into a list's items. */
  path: string[];
  /** A key being typed, or the value of `key`. */
  kind: 'key' | 'value';
  /** The key whose value is typed, when `kind` is `value`. */
  key?: string;
  /** What is typed so far, from `from` to the cursor. */
  typed: string;
  /** Where the typed text starts, as an offset into the text. */
  from: number;
  /** The column the keys of the cursor's mapping start at. */
  column: number;
  /** The keys already set in the cursor's mapping. */
  siblings: string[];
}

const bag = (value: unknown): Schema | null => (typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Schema : null);

/** The column a line's text starts at. */
const leftOf = (line: string): number => line.length - line.trimStart().length;

/** The column a line's key starts at, past a list item's `- `, and whether the line opens a list item. */
function keyColumn(line: string): { column: number; item: boolean } {
  const match = /^(\s*)(-\s+)?/.exec(line)!;
  return { column: match[1]!.length + (match[2]?.length ?? 0), item: match[2] !== undefined };
}

/** A line that sets a key, with the key in its first group. */
const KEY_LINE = /^\s*(?:-\s+)?([^\s:#'"][^:#]*?|'[^']*'|"[^"]*")\s*:(?:\s|$)/;
/** A key line whose value is on the lines under it. */
const OPENS = /:\s*(#.*)?$/;
const unquote = (key: string): string => (/^(['"]).*\1$/.test(key) ? key.slice(1, -1) : key);
const ignored = (line: string): boolean => line.trim() === '' || line.trim().startsWith('#');
const keyOf = (line: string): string | undefined => {
  const key = KEY_LINE.exec(line)?.[1];
  return key === undefined ? undefined : unquote(key.trim());
};

/**
 * The keys set in the mapping whose keys start at `column`, around line `at`.
 * Up, the scan stops at a line further left, or at the list item that opens
 * the mapping; down, at a line further left, which is also the next item.
 */
function siblingsAt(lines: string[], at: number, column: number, cursorItem: boolean): string[] {
  const keys: string[] = [];
  const push = (line: string): void => {
    const key = keyOf(line);
    if (key !== undefined) keys.push(key);
  };
  if (!cursorItem) {
    for (let index = at - 1; index >= 0; index--) {
      const line = lines[index]!;
      if (ignored(line)) continue;
      const own = keyColumn(line);
      if (own.item && own.column === column) {
        push(line);
        break;
      }
      if (leftOf(line) < column) break;
      if (leftOf(line) === column) push(line);
    }
  }
  for (let index = at + 1; index < lines.length; index++) {
    const line = lines[index]!;
    if (ignored(line)) continue;
    if (leftOf(line) < column) break;
    if (leftOf(line) === column) push(line);
  }
  return keys;
}

/** Where `offset` sits in `text`, or null where no hint applies, as in a comment or a flow collection. */
export function yamlPlace(text: string, offset: number): YamlPlace | null {
  const lines = text.split('\n');
  const at = text.slice(0, offset).split('\n').length - 1;
  const before = text.slice(0, offset).split('\n')[at]!;
  if (before.includes('#') || /[[{]/.test(before)) return null;
  const { column, item } = keyColumn(before);

  let kind: 'key' | 'value';
  let key: string | undefined;
  let typed: string;
  const asKey = /^\s*(?:-\s+)?([\w.$/-]*)$/.exec(before);
  const asValue = /^\s*(?:-\s+)?([^\s:#'"][^:#]*?|'[^']*'|"[^"]*")\s*:\s+(['"]?[^'"]*)$/.exec(before);
  if (asKey !== null) {
    kind = 'key';
    typed = asKey[1]!;
  } else if (asValue !== null) {
    kind = 'value';
    key = unquote(asValue[1]!.trim());
    typed = asValue[2]!;
  } else {
    return null;
  }

  // The parents: each line further left that opens the mapping, or the list item, the cursor is in.
  const path: string[] = [];
  let level = column;
  if (item) {
    path.unshift('[]');
    level = leftOf(before);
  }
  for (let index = at - 1; index >= 0 && level > 0; index--) {
    const line = lines[index]!;
    if (ignored(line) || leftOf(line) >= level) continue;
    const own = keyColumn(line);
    if (own.item && own.column === level) {
      // The first line of the list item the cursor's mapping belongs to.
      path.unshift('[]');
      level = leftOf(line);
      continue;
    }
    const opened = keyOf(line);
    if (opened === undefined || !OPENS.test(line)) return null;
    path.unshift(opened);
    if (own.item) path.unshift('[]');
    level = leftOf(line);
  }
  return { path, kind, ...(key === undefined ? {} : { key }), typed, from: offset - typed.length, column, siblings: siblingsAt(lines, at, column, item) };
}

/** A `$ref` inside the root schema, as `#/$defs/name` or `#/definitions/name`. */
function resolved(root: Schema, schema: Schema | null): Schema | null {
  let at = schema;
  for (let hops = 0; at !== null && typeof at.$ref === 'string' && hops < 16; hops++) {
    const ref = at.$ref as string;
    if (!ref.startsWith('#/')) return at;
    at = ref.slice(2).split('/').reduce<Schema | null>((held, part) => bag(held?.[part.replace(/~1/g, '/').replace(/~0/g, '~')]), root);
  }
  return at;
}

/** The schemas a value may follow: the schema itself, with each `anyOf`, `oneOf` and `allOf` branch beside it. */
function branches(root: Schema, schema: Schema | null, depth = 0): Schema[] {
  const one = resolved(root, schema);
  if (one === null || depth > 8) return [];
  const more = ['anyOf', 'oneOf', 'allOf'].flatMap((word) => (Array.isArray(one[word]) ? (one[word] as unknown[]) : []));
  return [one, ...more.flatMap((branch) => branches(root, bag(branch), depth + 1))];
}

/** The schemas at `path`, through each branch that has it. */
export function schemasAt(root: Schema, path: string[]): Schema[] {
  let at = branches(root, root);
  for (const step of path) {
    at = at.flatMap((schema) => {
      if (step === '[]') return branches(root, bag(schema.items));
      const named = bag(bag(schema.properties)?.[step]);
      if (named !== null) return branches(root, named);
      return branches(root, bag(schema.additionalProperties));
    });
  }
  return at;
}

const typeOf = (schema: Schema): string | undefined => (typeof schema.type === 'string' ? schema.type : Array.isArray(schema.enum) ? 'enum' : undefined);

/** A field's title and description, as a completion's side note. */
const infoOf = (schema: Schema): string | undefined => {
  const words = [schema.title, schema.description].filter((one): one is string => typeof one === 'string' && one !== '');
  return words.length === 0 ? undefined : words.join('\n\n');
};

/** The text a key's completion writes: the key, then its value's start, on the next line for a mapping or a list. */
export function keyInsertion(label: string, type: string | undefined, column: number): string {
  const under = ' '.repeat(column + 2);
  return type === 'object' ? `${label}:\n${under}` : type === 'array' ? `${label}:\n${under}- ` : `${label}: `;
}

/** Writes a key, and offers its values at once, as typing would. */
const applyKey = (text: string) => (view: EditorView, completion: Completion, from: number, to: number): void => {
  view.dispatch(insertCompletionText(view.state, text, from, to));
  startCompletion(view);
};

/** The keys allowed at `place`, less the ones already set in its mapping. */
export function keyOptions(root: Schema, place: YamlPlace): Completion[] {
  const seen = new Set<string>(place.siblings);
  const options: Completion[] = [];
  for (const schema of schemasAt(root, place.path)) {
    for (const [key, value] of Object.entries(bag(schema.properties) ?? {})) {
      if (seen.has(key)) continue;
      seen.add(key);
      const field = branches(root, bag(value))[0] ?? {};
      const type = typeOf(field);
      const label = /^[\w.$/-]+$/.test(key) ? key : JSON.stringify(key);
      const info = infoOf(field);
      options.push({
        label,
        type: 'property',
        ...(type === undefined ? {} : { detail: type }),
        ...(info === undefined ? {} : { info }),
        apply: applyKey(keyInsertion(label, type, place.column)),
      });
    }
  }
  return options;
}

/** A value as YAML writes it, quoted when plain text would read as something else. */
const scalar = (value: unknown): string => stringify(value).trim();

/** The values the field `place.key` allows: its labelled choices and enum, a boolean, a const, or its default. */
export function valueOptions(root: Schema, place: YamlPlace): Completion[] {
  if (place.key === undefined) return [];
  const options: Completion[] = [];
  const seen = new Set<string>();
  const add = (value: unknown, detail?: string, info?: string): void => {
    const label = scalar(value);
    if (seen.has(label)) return;
    seen.add(label);
    options.push({ label, type: 'enum', ...(detail === undefined ? {} : { detail }), ...(info === undefined ? {} : { info }) });
  };
  for (const schema of schemasAt(root, [...place.path, place.key])) {
    for (const one of Array.isArray(schema['x-enumOptions']) ? schema['x-enumOptions'] as unknown[] : []) {
      const option = bag(one);
      if (option === null || option.value === undefined) continue;
      const label = typeof option.label === 'string' && option.label !== String(option.value) ? option.label : undefined;
      add(option.value, label, typeof option.description === 'string' ? option.description : undefined);
    }
    if (Array.isArray(schema.enum)) for (const value of schema.enum) add(value);
    if (schema.const !== undefined) add(schema.const);
    if (schema.type === 'boolean') {
      add(true);
      add(false);
    }
    if (schema.default !== undefined && typeof schema.default !== 'object') add(schema.default, 'default');
  }
  return options;
}

/** The completion source for a YAML editor whose form follows `schemaOf()`, read at each completion. */
export function yamlCompletions(schemaOf: () => Schema | undefined): (context: CompletionContext) => CompletionResult | null {
  return (context) => {
    const schema = schemaOf();
    if (schema === undefined) return null;
    const place = yamlPlace(context.state.doc.toString(), context.pos);
    if (place === null) return null;
    // A key is offered once something is typed, or on Ctrl+Space; a value as soon as its key is written.
    if (place.kind === 'key' && place.typed === '' && !context.explicit) return null;
    const options = place.kind === 'key' ? keyOptions(schema, place) : valueOptions(schema, place);
    if (options.length === 0) return null;
    return { from: place.from, options, validFor: place.kind === 'key' ? /^[\w.$/-]*$/ : /^['"]?[^'"]*$/ };
  };
}
