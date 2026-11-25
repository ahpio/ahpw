import type { ToolCallResult, ToolDefinition } from '@microsoft/agent-host-protocol';
import type { Scena } from '@softov/scena/types';
import { check } from './check.js';
import { markOf, marksOn, modeOf } from './registry.js';

/** The tools this browser announces. */
export const TOOLS: ToolDefinition[] = [
  { name: 'listCommands', title: 'List commands', description: 'List the ahpw UI commands you can run.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true } },
  {
    name: 'runCommand',
    title: 'Run command',
    description: 'Run an ahpw UI command from listCommands.',
    inputSchema: { type: 'object', properties: { id: { type: 'string' }, args: { type: 'object' } }, required: ['id'] },
  },
];

const said = (success: boolean, message: string, text: string): ToolCallResult => ({
  success,
  pastTenseMessage: message,
  content: [{ type: 'text', text }] as never,
  ...(success ? {} : { error: { message: text } }),
});

export const refused = (text: string): ToolCallResult => said(false, 'Failed', text);

/** The command a `runCommand` call names. */
export const commandOf = (name: string, input: unknown): string | undefined => {
  const id = name === 'runCommand' ? (input as { id?: unknown } | null | undefined)?.id : undefined;
  return typeof id === 'string' ? id : undefined;
};

/** Runs one of `TOOLS` for a session on `host`, and says how it went. It never throws. */
export async function runTool(scena: Scena, host: string, name: string, input: unknown): Promise<ToolCallResult> {
  if (name === 'listCommands') {
    return said(true, 'Listed commands', JSON.stringify(marksOn(scena).map((mark) => ({ id: mark.id, description: mark.text, args: mark.input() }))));
  }
  if (name !== 'runCommand') return refused(`Unknown tool ${name}`);
  const id = commandOf(name, input);
  if (id === undefined) return refused('id: required');
  const mark = markOf(id);
  if (mark === undefined || modeOf(scena, id) === 'off') return refused(`${id} is not available`);
  const schema = mark.input();
  const args = (input as { args?: unknown }).args ?? {};
  const wrong = check(schema, args);
  if (wrong !== undefined) return refused(wrong);
  const given = args as Record<string, unknown>;
  const full = Object.hasOwn(schema.properties, 'host') && given.host === undefined ? { ...given, host } : given;
  try {
    await scena.commands.execute(id as string, full);
    return said(true, `Ran ${id}`, `Ran ${id}`);
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
}
