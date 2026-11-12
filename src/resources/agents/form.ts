/**
 * What the agent form draws and sends. The top is ahpw's own: the name, the
 * id, the owner, the description and the model. Below it, the engine's schema,
 * as the host lists it, in its own shape, each secret field a password. A
 * secret the host stores is never listed back, only its `{ $secret }`
 * reference. A field whose schema offers that shape shows the reference; any
 * other shows empty. Either one sent as `""` keeps the secret.
 */

import type { EnumOption, JsonSchemaObject } from '@softov/scena/ui';
import type { EngineRow, AgentOwner, AgentRow, AgentWanted } from '../../bridges/agents.js';
import { isSecret, isSecretRef } from '../../bridges/connectors.js';
import type { Icon } from '../../bridges/icons.js';
import { configForPut } from '../connectors/form.js';

type Bag = Record<string, unknown>;

const bagOf = (value: unknown): Bag => (typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Bag) : {});

/** The top of the form: name, id, owner, description, model. */
export interface AgentTop {
  id: string;
  owner: string;
  name: string;
  description: string;
  model: string;
}

/** The words the top schema is drawn with. */
export interface AgentTopWords {
  name: string;
  id: string;
  idHint: string;
  owner: string;
  description: string;
  model: string;
  modelHint: string;
}

/**
 * The top schema; a made agent has its id fixed, so its form draws no id. The
 * model is a choice among `models` when the host lists the agent's, and free
 * text otherwise.
 */
export function agentTopSchema(owners: readonly EnumOption[], editing: boolean, words: AgentTopWords, models: readonly EnumOption[] = []): JsonSchemaObject {
  const properties: Bag = {
    name: { type: 'string', title: words.name },
    ...(editing ? {} : { id: { type: 'string', title: words.id, description: words.idHint } }),
    owner: { type: 'string', title: words.owner, enum: owners.map((one) => one.value), 'x-enumOptions': [...owners] },
    description: { type: 'string', title: words.description },
    model: models.length === 0
      ? { type: 'string', title: words.model, description: words.modelHint }
      // The form puts its own empty choice first, which leaves the model to the agent.
      : { type: 'string', title: words.model, description: words.modelHint, enum: models.map((one) => one.value), 'x-enumOptions': [...models] },
  };
  return { type: 'object', properties, required: editing ? ['name', 'owner'] : ['name', 'id', 'owner'] } as JsonSchemaObject;
}

/** The values a form for `engine` starts from: a made agent's own, or a template's. */
export function topOf(record: AgentRow | undefined, owner: string): AgentTop {
  return {
    id: record?.id ?? '',
    owner: record?.owner ?? owner,
    name: record?.name ?? '',
    description: record?.description ?? '',
    model: record?.model ?? '',
  };
}

/**
 * The names of a map's entries drawn as a password: one ending in `_KEY`,
 * `_TOKEN`, `_SECRET` or `_PASSWORD`, or that word alone, in capitals or not.
 * Only the form hides them; the host keeps them as written.
 */
export const SECRET_NAME = '(?:^|_)(?:KEY|TOKEN|SECRET|PASSWORD|key|token|secret|password)$';

/** A value schema with its text drawn as a password, a union's text branches included. */
function asPassword(schema: Bag): Bag {
  const out: Bag = { ...schema };
  if (schema.type === 'string') out.format = 'password';
  for (const keyword of ['oneOf', 'anyOf'] as const) {
    const branches = schema[keyword];
    if (Array.isArray(branches)) out[keyword] = branches.map((branch) => asPassword(bagOf(branch)));
  }
  return out;
}

/**
 * A schema with each secret field, as `isSecret` says, at any depth and as a map's values,
 * drawn as a password. Where `held` keeps a secret at that field, its
 * description says it is kept. A map whose values hold text draws the entries
 * `SECRET_NAME` matches as a password too.
 */
function passwords(schema: Bag, held: unknown, keptWord: string): Bag {
  const out: Bag = { ...schema };
  if (isSecret(schema)) {
    out.format = 'password';
    if (isSecretRef(held)) out.description = keptWord;
  }
  const properties = bagOf(schema.properties);
  if (Object.keys(properties).length > 0) {
    out.properties = Object.fromEntries(Object.entries(properties).map(([name, field]) => [name, passwords(bagOf(field), bagOf(held)[name], keptWord)]));
  }
  const values = schema.additionalProperties;
  if (typeof values === 'object' && values !== null) {
    const drawn = passwords(values as Bag, undefined, keptWord);
    out.additionalProperties = drawn;
    const hidden = asPassword(drawn);
    if (JSON.stringify(hidden) !== JSON.stringify(drawn)) out.patternProperties = { ...bagOf(schema.patternProperties), [SECRET_NAME]: hidden };
  }
  return out;
}

/**
 * The engine's schema as the form draws it: as the host lists it, with each
 * secret field a password. A `hostOnly` field is left out of a record the
 * host does not own. The schema's own description is left out, since the
 * section's heading names the form.
 */
export function engineSchema(engine: EngineRow, held: Bag, owner: string, keptWord: string): JsonSchemaObject {
  const drawn: Bag = { ...passwords(engine.schema, held, keptWord) };
  delete drawn.description;
  if (owner === 'host' || (engine.hostOnly ?? []).length === 0) return drawn as JsonSchemaObject;
  const properties = { ...bagOf(drawn.properties) };
  for (const field of engine.hostOnly ?? []) delete properties[field];
  return { ...drawn, properties } as JsonSchemaObject;
}

/** Whether a schema node offers a `{ "$secret" }` reference as one of its shapes. */
function offersSecretRef(schema: Bag): boolean {
  const branches = [schema.oneOf, schema.anyOf].flatMap((one) => (Array.isArray(one) ? one : []));
  return branches.some((branch) => Object.hasOwn(bagOf(bagOf(branch).properties), '$secret'));
}

/** The schema of the field `name` of an object schema: its own property, else the schema of any other key. */
function fieldSchema(schema: Bag, name: string): Bag {
  const properties = bagOf(schema.properties);
  return Object.hasOwn(properties, name) ? bagOf(properties[name]) : bagOf(schema.additionalProperties);
}

/**
 * A held config as the form shows it, read against the engine's `schema`: the
 * same shape, with each kept secret as its reference where the schema offers a
 * `{ "$secret" }` shape there, and empty elsewhere, since the host never lists
 * its value.
 */
export function agentConfigForForm(config: Bag, schema: Bag): Bag {
  const shown = (value: unknown, at: Bag): unknown => {
    if (isSecretRef(value)) return offersSecretRef(at) ? value : '';
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return value;
    return Object.fromEntries(Object.entries(value as Bag).map(([name, one]) => [name, shown(one, fieldSchema(at, name))]));
  };
  return shown(config, schema) as Bag;
}

/**
 * Each secret `held` keeps, at any depth, sent as `""` where the form leaves it
 * empty or holds its own reference, so the host keeps it. A put that names the
 * record's own secret takes it out of the vault, so the reference is never sent
 * back as it is.
 *
 * A field the schema declares stays in the form when it is left empty, so one
 * missing from the form is kept. An entry of an open map, such as `env`, is one
 * the person can take out, so one missing from the form is left out of the put
 * and the host drops it with its secret.
 */
function keepSecrets(form: Bag, held: Bag, schema: Bag): Bag {
  const out: Bag = { ...form };
  const declared = bagOf(schema.properties);
  for (const [name, value] of Object.entries(held)) {
    const sent = out[name];
    if (isSecretRef(value)) {
      if (sent === undefined || sent === null) {
        if (name in declared) out[name] = '';
      } else if (isSecretRef(sent) && sent.$secret === value.$secret) {
        out[name] = '';
      }
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const inner = name in declared ? bagOf(declared[name]) : bagOf(schema.additionalProperties);
      if (sent === undefined || (typeof sent === 'object' && sent !== null && !Array.isArray(sent))) out[name] = keepSecrets(bagOf(sent), value as Bag, inner);
    }
  }
  return out;
}

/**
 * The config a put sends, in the shape the form holds. A top secret field
 * left empty goes as `""`, and so does each secret the record keeps at any
 * depth, which keeps the one stored. A `hostOnly` field is left out of a record
 * the host does not own.
 */
export function agentConfigForPut(engine: EngineRow, form: Bag, held: Bag, owner: string): Bag {
  const out = keepSecrets(configForPut(form, engine.schema), held, engine.schema);
  if (owner !== 'host') for (const field of engine.hostOnly ?? []) delete out[field];
  return out;
}

/** Whether an engine's form has a secret field, so its Settings say how a kept one is shown. */
export function hasSecrets(engine: EngineRow): boolean {
  const any = (schema: Bag): boolean =>
    isSecret(schema)
    || Object.values(bagOf(schema.properties)).some((field) => any(bagOf(field)))
    || (typeof schema.additionalProperties === 'object' && schema.additionalProperties !== null && any(schema.additionalProperties as Bag));
  return any(engine.schema);
}

/** What a put sends for a form: the top trimmed, the config made from the engine, and the icon the agent has. */
export function agentWanted(engine: EngineRow, top: AgentTop, form: Bag, held: Bag, icon?: Icon): AgentWanted {
  return {
    ...(icon === undefined ? {} : { icon }),
    id: top.id,
    engine: engine.name,
    owner: top.owner as AgentOwner,
    name: top.name.trim(),
    description: top.description.trim(),
    model: top.model.trim(),
    config: agentConfigForPut(engine, form, held, top.owner),
  };
}

/** What a new record of an engine starts from: its template at `at`, or a blank record for -1. */
export function startOf(engine: EngineRow, at: number): { top: Pick<AgentTop, 'name' | 'description' | 'model'>; config: Bag; icon?: Icon } {
  const template = at === -1 ? undefined : engine.templates?.[at];
  return {
    top: { name: template?.name ?? '', description: template?.description ?? '', model: template?.model ?? '' },
    config: agentConfigForForm(bagOf(template?.config), engine.schema),
    ...(template?.icon === undefined ? {} : { icon: template.icon }),
  };
}
