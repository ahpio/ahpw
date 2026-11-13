import { describe, expect, it } from 'vitest';
import { keyInsertion, keyOptions, schemasAt, valueOptions, yamlPlace } from './yaml-hints.js';

const SCHEMA = {
  type: 'object',
  properties: {
    source: { type: 'string', title: 'Source', enum: ['image', 'devcontainer'], 'x-enumOptions': [{ value: 'image', label: 'Image' }, { value: 'devcontainer', label: 'Dev container', description: 'From a folder.' }] },
    image: { type: 'string', description: 'What to make it from.', default: 'debian:bookworm-slim' },
    cpus: { type: 'string' },
    privileged: { type: 'boolean' },
    limits: { type: 'object', properties: { memory: { type: 'string' }, pids: { type: 'integer' } } },
    mounts: { type: 'array', items: { $ref: '#/$defs/mount' } },
    tag: { anyOf: [{ type: 'string', enum: ['1', 'latest'] }, { type: 'null' }] },
  },
  $defs: { mount: { type: 'object', properties: { from: { type: 'string' }, to: { type: 'string' }, readOnly: { type: 'boolean' } } } },
};

/** The place at the `|` in `text`. */
const placeOf = (text: string) => yamlPlace(text.replace('|', ''), text.indexOf('|'));
const labels = (options: { label: string }[]) => options.map((one) => one.label);

describe('yamlPlace', () => {
  it('finds a key typed at the root', () => {
    expect(placeOf('cpus: "2"\nim|')).toEqual({ path: [], kind: 'key', typed: 'im', from: 10, column: 0, siblings: ['cpus'] });
  });

  it('finds the mapping a nested key is typed in', () => {
    expect(placeOf('limits:\n  memory: 1g\n  p|')).toMatchObject({ path: ['limits'], kind: 'key', typed: 'p', column: 2, siblings: ['memory'] });
  });

  it('steps into a list item, on its first line and on the lines after it', () => {
    expect(placeOf('mounts:\n  - fr|')).toMatchObject({ path: ['mounts', '[]'], kind: 'key', typed: 'fr', column: 4, siblings: [] });
    expect(placeOf('mounts:\n  - from: /a\n    t|\n  - to: /b')).toMatchObject({ path: ['mounts', '[]'], kind: 'key', siblings: ['from'] });
  });

  it('finds the value of a key', () => {
    expect(placeOf('source: dev|')).toMatchObject({ path: [], kind: 'value', key: 'source', typed: 'dev', from: 8 });
    expect(placeOf('limits:\n  pids: |')).toMatchObject({ path: ['limits'], kind: 'value', key: 'pids', typed: '' });
  });

  it('gives no place in a comment, a flow collection or under a scalar', () => {
    expect(placeOf('# im|')).toBeNull();
    expect(placeOf('limits: { mem|')).toBeNull();
    expect(placeOf('cpus: 2\n  me|')).toBeNull();
  });
});

describe('schemasAt', () => {
  it('follows properties, items, a $ref and anyOf branches', () => {
    expect(schemasAt(SCHEMA, ['mounts', '[]'])[0]).toBe(SCHEMA.$defs.mount);
    expect(schemasAt(SCHEMA, ['tag']).map((one) => one.type)).toEqual([undefined, 'string', 'null']);
  });
});

describe('keyOptions', () => {
  it('offers the keys not set yet, each with its type and words', () => {
    const options = keyOptions(SCHEMA, placeOf('cpus: "2"\n|')!);
    expect(labels(options)).toEqual(['source', 'image', 'privileged', 'limits', 'mounts', 'tag']);
    expect(options[1]).toMatchObject({ label: 'image', detail: 'string', info: 'What to make it from.' });
  });

  it('writes a scalar key with its value after it, and opens a nested mapping or list on the next line', () => {
    expect(keyInsertion('image', 'string', 0)).toBe('image: ');
    expect(keyInsertion('limits', 'object', 0)).toBe('limits:\n  ');
    expect(keyInsertion('mounts', 'array', 4)).toBe('mounts:\n      - ');
  });

  it('offers a list item\'s keys from its $ref', () => {
    expect(labels(keyOptions(SCHEMA, placeOf('mounts:\n  - from: /a\n    |')!))).toEqual(['to', 'readOnly']);
  });
});

describe('valueOptions', () => {
  it('offers labelled choices, with their labels and words', () => {
    const options = valueOptions(SCHEMA, placeOf('source: |')!);
    expect(options).toEqual([
      { label: 'image', type: 'enum', detail: 'Image' },
      { label: 'devcontainer', type: 'enum', detail: 'Dev container', info: 'From a folder.' },
    ]);
  });

  it('offers true and false, a default, and quotes a value YAML would read as another type', () => {
    expect(labels(valueOptions(SCHEMA, placeOf('privileged: |')!))).toEqual(['true', 'false']);
    expect(valueOptions(SCHEMA, placeOf('image: |')!)).toEqual([{ label: 'debian:bookworm-slim', type: 'enum', detail: 'default' }]);
    expect(labels(valueOptions(SCHEMA, placeOf('tag: |')!))).toEqual(['"1"', 'latest']);
  });

  it('offers nothing for a free text field', () => {
    expect(valueOptions(SCHEMA, placeOf('cpus: |')!)).toEqual([]);
  });
});
