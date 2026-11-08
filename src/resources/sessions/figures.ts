import type { ActiveTurn, ToolCallState, Turn } from '@microsoft/agent-host-protocol';
import { rawOf } from './raw.js';
import { factsOf } from './turn.js';

/** How many of the newest turns *Per turn* shows. */
export const PER_TURN = 6;

/** How many tools *Tools* shows, the most called first. */
export const TOOLS_SHOWN = 8;

/** One turn of *Per turn*: its place from 1, its prompt (fresh and cached input) and the cached part. */
export interface TurnLine {
  index: number;
  prompt: number;
  cached: number;
}

/** One tool of *Tools*: its calls, the calls that failed, and the calls somebody denied. */
export interface ToolLine {
  name: string;
  calls: number;
  failed: number;
  denied: number;
}

/** What a chat's turns add up to, for the Summary in the session header. */
export interface SessionFigures {
  /** Finished turns, and the one running. */
  turns: number;
  cancelled: number;
  /** The sum of the finished turns' durations, in milliseconds. */
  working: number;
  /** The fresh input: what the host's `inputTokens` holds. */
  input: number;
  output: number;
  cached: number;
  /** Every row the Raw view draws. */
  steps: number;
  toolCalls: number;
  /** Output tokens per second of work, when the turns took any time. */
  outputPerSecond?: number;
  /** The newest turns, newest first, at most `PER_TURN`. */
  perTurn: TurnLine[];
  /** Every tool called, the most called first. */
  tools: ToolLine[];
}

/** The tool calls of a turn. */
function callsOf(turn: Turn | ActiveTurn): ToolCallState[] {
  return turn.responseParts.flatMap((part) => (String(part.kind) === 'toolCall' && 'toolCall' in part ? [part.toolCall as ToolCallState] : []));
}

/**
 * The figures of a chat: its loaded turns, then the one running, whose usage
 * is the host's running total for that turn and counts once as it stands. The
 * rate is finished output over finished time, as the running turn has no
 * duration yet.
 */
export function figuresOf(turns: readonly Turn[], active: ActiveTurn | undefined): SessionFigures {
  const all: (Turn | ActiveTurn)[] = active === undefined ? [...turns] : [...turns, active];
  let working = 0;
  let input = 0;
  let output = 0;
  let cached = 0;
  let finishedOutput = 0;
  const lines: TurnLine[] = [];
  const tools = new Map<string, ToolLine>();
  all.forEach((turn, at) => {
    const facts = factsOf(turn);
    working += facts.duration ?? 0;
    input += facts.input ?? 0;
    output += facts.output ?? 0;
    cached += facts.cacheRead ?? 0;
    if (at < turns.length) finishedOutput += facts.output ?? 0;
    lines.push({ index: at + 1, prompt: (facts.input ?? 0) + (facts.cacheRead ?? 0), cached: facts.cacheRead ?? 0 });
    for (const call of callsOf(turn)) {
      const name = call.displayName || call.toolName;
      const line = tools.get(name) ?? { name, calls: 0, failed: 0, denied: 0 };
      line.calls += 1;
      const held = call as unknown as { success?: unknown; status?: unknown; reason?: unknown };
      if (held.success === false) line.failed += 1;
      if (String(held.status) === 'cancelled' && String(held.reason) === 'denied') line.denied += 1;
      tools.set(name, line);
    }
  });
  const raw = rawOf(turns, active);
  return {
    turns: all.length,
    cancelled: turns.filter((turn) => String(turn.state) === 'cancelled').length,
    working,
    input,
    output,
    cached,
    steps: raw.reduce((sum, turn) => sum + turn.steps.length, 0),
    toolCalls: [...tools.values()].reduce((sum, line) => sum + line.calls, 0),
    ...(working > 0 ? { outputPerSecond: finishedOutput / (working / 1000) } : {}),
    perTurn: lines.reverse().slice(0, PER_TURN),
    tools: [...tools.values()].sort((a, b) => b.calls - a.calls || a.name.localeCompare(b.name)),
  };
}
