import { describe, expect, it } from 'vitest';
import type { EngineRow } from '../../bridges/agents.js';
import { idFor } from '../connectors/form.js';
import { agentConfigForForm, agentConfigForPut, agentWanted, engineSchema, hasSecrets, SECRET_NAME, startOf } from './form.js';

const ENGINE: EngineRow = {
  name: 'claude',
  title: 'Claude Code',
  description: '',
  plugin: 'agent-claude',
  schema: {
    type: 'object',
    properties: {
      outputStyle: { type: 'string' },
      apiKey: { type: 'string', writeOnly: true },
      env: { type: 'object', properties: { ANTHROPIC_API_KEY: { type: 'string', writeOnly: true } }, additionalProperties: { type: 'string' } },
      extraArgs: { type: 'object' },
    },
  },
  hostOnly: ['extraArgs'],
  keyVariables: ['ANTHROPIC_API_KEY'],
};

const KEPT = { $secret: 'host/agent/claude/env.ANTHROPIC_API_KEY' };

describe('engineSchema', () => {
  it('draws a secret field as a password, and leaves one marked secret: false in the record', () => {
    const engine: EngineRow = { ...ENGINE, schema: { type: 'object', properties: { token: { type: 'string', secret: true }, shown: { type: 'string', writeOnly: true, secret: false } } } };
    const drawn = engineSchema(engine, {}, 'host', 'Kept') as { properties: Record<string, Record<string, unknown>> };
    expect(drawn.properties.token?.format).toBe('password');
    expect(drawn.properties.shown?.format).toBeUndefined();
    expect(hasSecrets(engine)).toBe(true);
  });

  it('leaves out the schema\'s own description, which the heading replaces', () => {
    const engine: EngineRow = { ...ENGINE, schema: { type: 'object', description: 'Runs Claude.', properties: { shown: { type: 'string' } } } };
    expect(engineSchema(engine, {}, 'host', 'Kept')).toEqual({ type: 'object', properties: { shown: { type: 'string' } } });
  });

  it('draws the schema in its own shape, each writeOnly field a password, and says a stored one is kept', () => {
    const drawn = engineSchema(ENGINE, { apiKey: { $secret: 'x' }, env: { ANTHROPIC_API_KEY: KEPT } }, 'host', 'Kept') as { properties: Record<string, Record<string, unknown>> };
    expect(Object.keys(drawn.properties)).toEqual(['outputStyle', 'apiKey', 'env', 'extraArgs']);
    expect(drawn.properties.apiKey).toEqual({ type: 'string', writeOnly: true, format: 'password', description: 'Kept' });
    expect(drawn.properties.env).toEqual({
      type: 'object',
      properties: { ANTHROPIC_API_KEY: { type: 'string', writeOnly: true, format: 'password', description: 'Kept' } },
      additionalProperties: { type: 'string' },
      patternProperties: { [SECRET_NAME]: { type: 'string', format: 'password' } },
    });
  });

  it('draws a map of secrets with each value a password', () => {
    const engine: EngineRow = { ...ENGINE, schema: { type: 'object', properties: { env: { type: 'object', additionalProperties: { type: 'string', writeOnly: true } } } } };
    const drawn = engineSchema(engine, {}, 'host', 'Kept') as { properties: Record<string, Record<string, unknown>> };
    expect(drawn.properties.env?.additionalProperties).toEqual({ type: 'string', writeOnly: true, format: 'password' });
  });

  it('draws a map entry named like a secret as a password, a union\'s text included', () => {
    const engine: EngineRow = { ...ENGINE, schema: { type: 'object', properties: { env: { type: 'object', additionalProperties: { oneOf: [{ type: 'string' }, { type: 'null' }] } } } } };
    const drawn = engineSchema(engine, {}, 'host', 'Kept') as { properties: Record<string, Record<string, unknown>> };
    expect(drawn.properties.env?.patternProperties).toEqual({ [SECRET_NAME]: { oneOf: [{ type: 'string', format: 'password' }, { type: 'null' }] } });
    const secret = new RegExp(SECRET_NAME, 'u');
    expect(['ANTHROPIC_API_KEY', 'GITHUB_TOKEN', 'CLIENT_SECRET', 'DB_PASSWORD', 'api_key', 'TOKEN'].every((name) => secret.test(name))).toBe(true);
    expect(['BASE_URL', 'KEYBOARD', 'TOKENS', 'DEBUG'].some((name) => secret.test(name))).toBe(false);
  });

  it('adds no pattern to a map whose values hold no text', () => {
    const engine: EngineRow = { ...ENGINE, schema: { type: 'object', properties: { flags: { type: 'object', additionalProperties: { type: 'boolean' } } } } };
    const drawn = engineSchema(engine, {}, 'host', 'Kept') as { properties: Record<string, Record<string, unknown>> };
    expect(drawn.properties.flags?.patternProperties).toBeUndefined();
  });

  it('leaves the host-only fields out of a record the host does not own, and keeps env', () => {
    const drawn = engineSchema(ENGINE, {}, 'user:ana', 'Kept') as { properties: Record<string, unknown> };
    expect(Object.keys(drawn.properties)).toEqual(['outputStyle', 'apiKey', 'env']);
  });
});

describe('the config', () => {
  it('shows the held config in its own shape, each kept secret empty', () => {
    expect(agentConfigForForm({ apiKey: { $secret: 'x' }, env: { ANTHROPIC_API_KEY: KEPT, DEBUG: '1' } }, ENGINE.schema)).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: '', DEBUG: '1' } });
  });

  it('sends an untouched kept secret as "" to keep it', () => {
    const held = { apiKey: { $secret: 'x' }, env: { ANTHROPIC_API_KEY: KEPT } };
    expect(agentConfigForPut(ENGINE, agentConfigForForm(held, ENGINE.schema), held, 'host')).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: '' } });
    expect(agentConfigForPut(ENGINE, {}, held, 'host')).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: '' } });
  });

  it('sends a typed key where the form holds it', () => {
    expect(agentConfigForPut(ENGINE, { env: { ANTHROPIC_API_KEY: 'sk-new' } }, {}, 'host')).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: 'sk-new' } });
  });

  it('drops the host-only fields from a record the host does not own', () => {
    expect(agentConfigForPut(ENGINE, { extraArgs: { x: null }, env: { ANTHROPIC_API_KEY: 'k' } }, {}, 'user:ana')).toEqual({ apiKey: '', env: { ANTHROPIC_API_KEY: 'k' } });
  });
});

describe('a kept secret where the schema offers a reference', () => {
  const REFERENCE = (keyword: string): Record<string, unknown> => ({ type: 'object', properties: { [keyword]: { type: 'string' } }, required: [keyword], additionalProperties: false });
  const REFS: EngineRow = {
    ...ENGINE,
    schema: { type: 'object', properties: { env: { type: 'object', additionalProperties: { oneOf: [{ type: 'string' }, { type: 'null' }, REFERENCE('fromEnv'), REFERENCE('$secret')] } } } },
  };
  const held = { env: { ANTHROPIC_API_KEY: KEPT, DEBUG: '1' } };

  it('shows the reference itself', () => {
    expect(agentConfigForForm(held, REFS.schema)).toEqual({ env: { ANTHROPIC_API_KEY: KEPT, DEBUG: '1' } });
  });

  it('sends the reference left as it is as "", so the host keeps the secret', () => {
    expect(agentConfigForPut(REFS, agentConfigForForm(held, REFS.schema), held, 'host')).toEqual({ env: { ANTHROPIC_API_KEY: '', DEBUG: '1' } });
  });

  it('sends a reference changed to another name, or a typed value, as it is', () => {
    const other = { $secret: 'host:anthropic' };
    expect(agentConfigForPut(REFS, { env: { ANTHROPIC_API_KEY: other } }, held, 'host')).toEqual({ env: { ANTHROPIC_API_KEY: other } });
    expect(agentConfigForPut(REFS, { env: { ANTHROPIC_API_KEY: 'sk-new' } }, held, 'host')).toEqual({ env: { ANTHROPIC_API_KEY: 'sk-new' } });
  });
});

describe('agentWanted', () => {
  it('trims the top and keeps the icon', () => {
    const icon = { src: 'data:image/svg+xml;base64,eA==' };
    expect(agentWanted(ENGINE, { id: 'claude', owner: 'host', name: ' Claude ', description: '', model: '' }, {}, {}, icon)).toEqual({
      icon, id: 'claude', engine: 'claude', owner: 'host', name: 'Claude', description: '', model: '', config: { apiKey: '' },
    });
  });
});

describe('a new record', () => {
  const engine: EngineRow = { ...ENGINE, templates: [{ name: 'Claude Code', description: 'As the host runs it.', model: 'opus', icon: { src: 'data:image/png;base64,eA==' }, config: { outputStyle: 'brief' } }] };

  it('starts from a template, as the template holds it', () => {
    expect(startOf(engine, 0)).toEqual({
      top: { name: 'Claude Code', description: 'As the host runs it.', model: 'opus' },
      config: { outputStyle: 'brief' },
      icon: { src: 'data:image/png;base64,eA==' },
    });
  });

  it('starts blank, and takes its id from its name', () => {
    expect(startOf(engine, -1)).toEqual({ top: { name: '', description: '', model: '' }, config: {} });
    expect(idFor('Claude Code', 'claude', ['claude-code'])).toBe('claude-code-2');
    expect(idFor('', 'claude', [])).toBe('claude');
  });
});
