import { describe, expect, it } from 'vitest';
import type { ActiveTurn, ResponsePart, Turn } from '@microsoft/agent-host-protocol';
import { figuresOf, PER_TURN } from './figures.js';

const tool = (id: string, name: string, fields: Record<string, unknown> = {}): ResponsePart =>
  ({ kind: 'toolCall', toolCall: { toolCallId: id, toolName: name, displayName: name, status: 'completed', success: true, invocationMessage: name, ...fields } }) as unknown as ResponsePart;

const turn = (id: string, parts: ResponsePart[], extra: Record<string, unknown> = {}): Turn =>
  ({ id, message: { text: `ask ${id}` }, responseParts: parts, startedAt: '2026-11-08T10:00:00Z', duration: 2000, state: 'complete', ...extra }) as unknown as Turn;

const usage = (inputTokens: number, outputTokens: number, cacheReadTokens: number): Record<string, unknown> => ({ usage: { inputTokens, outputTokens, cacheReadTokens } });

describe('figuresOf', () => {
  it('adds the fresh input, the output and the cached input apart, and counts the cancelled turns', () => {
    const figures = figuresOf([turn('a', [], usage(100, 40, 900)), turn('b', [], { ...usage(50, 10, 1000), state: 'cancelled' })], undefined);
    expect([figures.turns, figures.cancelled, figures.working]).toEqual([2, 1, 4000]);
    expect([figures.input, figures.output, figures.cached]).toEqual([150, 50, 1900]);
    expect(figures.outputPerSecond).toBe(12.5);
  });

  it('counts the running turn once, as its usage stands, and leaves its output out of the rate', () => {
    const active = { ...turn('b', [], usage(10, 500, 0)), duration: undefined } as unknown as ActiveTurn;
    const figures = figuresOf([turn('a', [], usage(100, 40, 0))], active);
    expect([figures.turns, figures.output, figures.outputPerSecond]).toEqual([2, 540, 20]);
  });

  it('counts each tool by its name, with its failed and denied calls, the most called first', () => {
    const parts = [
      tool('1', 'Read'),
      tool('2', 'Bash', { success: false }),
      tool('3', 'Bash'),
      tool('4', 'Edit', { status: 'cancelled', reason: 'denied', success: undefined }),
    ];
    const figures = figuresOf([turn('a', parts)], undefined);
    expect(figures.tools).toEqual([
      { name: 'Bash', calls: 2, failed: 1, denied: 0 },
      { name: 'Edit', calls: 1, failed: 0, denied: 1 },
      { name: 'Read', calls: 1, failed: 0, denied: 0 },
    ]);
    expect(figures.toolCalls).toBe(4);
  });

  it('counts a step for every row the Raw view draws: the message and each part that is not blank', () => {
    const parts = [tool('1', 'Read'), { kind: 'markdown', id: 'm0', content: '  ' }, { kind: 'markdown', id: 'm1', content: 'Done.' }] as unknown as ResponsePart[];
    expect(figuresOf([turn('a', parts)], undefined).steps).toBe(3);
  });

  it('lists the newest turns first, each with its prompt and its cached part', () => {
    const turns = Array.from({ length: PER_TURN + 2 }, (_, at) => turn(String(at), [], usage(10 * (at + 1), 1, 100)));
    const lines = figuresOf(turns, undefined).perTurn;
    expect(lines).toHaveLength(PER_TURN);
    expect(lines[0]).toEqual({ index: PER_TURN + 2, prompt: 10 * (PER_TURN + 2) + 100, cached: 100 });
  });
});
