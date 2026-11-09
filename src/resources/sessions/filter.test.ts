import { expect, test } from 'vitest';
import type { ResponsePart, Turn } from '@microsoft/agent-host-protocol';
import { EMPTY_FILTER, filtering, matchTurn, type StepFilter } from './filter.js';

const tool = (id: string, toolName: string, fields: Record<string, unknown> = {}): ResponsePart =>
  ({ kind: 'toolCall', toolCall: { toolCallId: id, toolName, displayName: toolName, status: 'completed', success: true, invocationMessage: `Ran ${id}`, ...fields } }) as unknown as ResponsePart;

const turn = (origin: string, parts: unknown[], text = 'Fix the login redirect'): Turn =>
  ({ id: 'a', message: { text, origin: { kind: origin } }, responseParts: parts, startedAt: '2026-11-09T10:00:00Z' }) as unknown as Turn;

const parts = [
  { kind: 'reasoning', id: 'r', content: 'Look at the login handler' },
  tool('t1', 'Bash', { displayName: 'Run command', invocationMessage: 'rg -n redirect src' }),
  tool('t2', 'Bash', { success: false, invocationMessage: 'pnpm test' }),
  tool('t3', 'Task', { invocationMessage: 'Review the change' }),
  { kind: 'markdown', id: 'm', content: 'The redirect keeps the next page now.' },
  { kind: 'markdown', id: 'blank', content: '  ' },
  { kind: 'inputRequest', request: { id: 'q', message: 'Push the branch?' } },
  { kind: 'error', error: { message: 'Rate limited' } },
  { kind: 'systemNotification', content: 'Background task done' },
];
const spawned = new Map([['t3', 'c://worker']]);
const kept = (filter: Partial<StepFilter>, origin = 'user'): [boolean, boolean[]] => {
  const match = matchTurn(turn(origin, parts), { ...EMPTY_FILTER, ...filter }, spawned);
  return [match.message, [...match.parts]];
};

test('a filter keeps less only with a text, a type other than all, or errors', () => {
  expect(filtering(null)).toBe(false);
  expect(filtering(EMPTY_FILTER)).toBe(false);
  expect(filtering({ ...EMPTY_FILTER, text: '  ', highlight: true })).toBe(false);
  expect(filtering({ ...EMPTY_FILTER, type: 'tool' })).toBe(true);
  expect(filtering({ ...EMPTY_FILTER, errors: true })).toBe(true);
});

test('each type keeps its steps, and a blank part is no step', () => {
  expect(kept({ type: 'user' })).toEqual([true, [false, false, false, false, false, false, false, false, false]]);
  expect(kept({ type: 'user' }, 'automation')[0]).toBe(false);
  expect(kept({ type: 'agent' })[1]).toEqual([true, false, false, false, true, false, false, false, false]);
  expect(kept({ type: 'tool' })[1]).toEqual([false, true, true, true, false, false, false, false, false]);
  expect(kept({ type: 'subagent' })[1]).toEqual([false, false, false, true, false, false, false, false, false]);
  expect(kept({ type: 'question' })[1]).toEqual([false, false, false, false, false, false, true, false, false]);
  expect(kept({ type: 'notification' })[1]).toEqual([false, false, false, false, false, false, false, false, true]);
  expect(kept({ type: 'notification' }, 'systemNotification')[0]).toBe(true);
});

test('the text matches a step in any case, and a call by its tool name too', () => {
  expect(kept({ text: 'REDIRECT' })).toEqual([true, [false, true, false, false, true, false, false, false, false]]);
  // The line of a call shows its command; its tool's names still match.
  expect(kept({ type: 'tool', text: 'bash' })[1]).toEqual([false, true, true, false, false, false, false, false, false]);
  expect(kept({ type: 'tool', text: 'run command' })[1]).toEqual([false, true, false, false, false, false, false, false, false]);
});

test('errors keeps an error and a failed call, and works with the type', () => {
  expect(kept({ errors: true })[1]).toEqual([false, false, true, false, false, false, false, true, false]);
  expect(kept({ errors: true, type: 'tool' })[1]).toEqual([false, false, true, false, false, false, false, false, false]);
});

test('a turn counts its message and each part that draws', () => {
  const match = matchTurn(turn('user', parts), { ...EMPTY_FILTER, type: 'tool' }, spawned);
  expect([match.count, match.total]).toEqual([3, 9]);
});
