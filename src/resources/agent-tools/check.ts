/** The part of JSON Schema a mark's input uses. */
export interface InputField {
  type: 'string' | 'number' | 'integer' | 'boolean';
  description?: string;
  enum?: readonly string[];
}

/** A command's input: named fields, some required. */
export interface InputSchema {
  type: 'object';
  properties: Record<string, InputField>;
  required?: readonly string[];
}

function fits(field: InputField, value: unknown): boolean {
  if (field.type === 'integer') return Number.isInteger(value);
  if (field.type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (typeof value !== field.type) return false;
  return field.enum === undefined || field.enum.includes(value as string);
}

/** What is wrong with `input`, naming the field; undefined when it fits. A field the schema does not name is wrong. */
export function check(schema: InputSchema, input: unknown): string | undefined {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return 'args: not an object';
  const given = input as Record<string, unknown>;
  for (const name of schema.required ?? []) {
    if (given[name] === undefined) return `${name}: required`;
  }
  for (const [name, value] of Object.entries(given)) {
    const field = Object.hasOwn(schema.properties, name) ? schema.properties[name] : undefined;
    if (field === undefined) return `${name}: unknown field`;
    if (!fits(field, value)) return `${name}: expected ${field.enum === undefined ? field.type : field.enum.join(' | ')}`;
  }
  return undefined;
}
