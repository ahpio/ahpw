/**
 * The filter a session's chat and Raw view share: a text, a type of step, the
 * failed steps only, and whether the matches are the only steps shown or are
 * marked among the others.
 */

import { useCallback, useState } from 'react';
import type { ActiveTurn, Turn } from '@microsoft/agent-host-protocol';
import { stepOf, type RawStep } from './raw.js';
import { outcomeOf } from './tool.js';

/** The types of step the filter picks from, `all` first. */
export const STEP_TYPES = ['all', 'user', 'agent', 'tool', 'subagent', 'question', 'notification'] as const;

export type StepType = (typeof STEP_TYPES)[number];

export interface StepFilter {
  /** Kept when a step's text, or a call's tool name, holds it, in any case. */
  text: string;
  type: StepType;
  /** Only the steps that failed: an error, or a call that did not succeed. */
  errors: boolean;
  /** Marks the matches among every step, in place of showing only the matches. */
  highlight: boolean;
}

export const EMPTY_FILTER: StepFilter = { text: '', type: 'all', errors: false, highlight: false };

/** Whether a filter keeps fewer steps than all of them. */
export function filtering(filter: StepFilter | null): filter is StepFilter {
  return filter !== null && (filter.text.trim() !== '' || filter.type !== 'all' || filter.errors);
}

/** A step as the filter reads it. */
export type FilterStep = Pick<RawStep, 'kind' | 'text' | 'call' | 'source'>;

/** The `kind` a step's source carries: a message's origin, else a part's kind. */
function sourceKind(step: FilterStep): string | undefined {
  const held = (typeof step.source === 'object' && step.source !== null ? step.source : {}) as { kind?: unknown; origin?: { kind?: unknown } };
  const kind = step.kind === 'message' ? held.origin?.kind : held.kind;
  return kind === undefined ? undefined : String(kind);
}

/** Whether a step is of a type; `spawned` holds the calls that started a subagent chat, by tool call id. */
function ofType(step: FilterStep, type: StepType, spawned: ReadonlyMap<string, string>): boolean {
  switch (type) {
    case 'all': return true;
    case 'user': return step.kind === 'message' && sourceKind(step) === 'user';
    case 'agent': return step.kind === 'text' || step.kind === 'reasoning';
    case 'tool': return step.call !== undefined;
    case 'subagent': return step.call !== undefined && spawned.has(step.call.toolCallId);
    case 'question': return step.kind === 'question';
    case 'notification': return (step.kind === 'message' || step.kind === 'note') && sourceKind(step) === 'systemNotification';
  }
}

/** Whether a step failed: an error part, or a call that ended without success. */
function failed(step: FilterStep): boolean {
  return step.kind === 'error' || (step.call !== undefined && outcomeOf(step.call) === 'failed');
}

/** Whether a filter keeps a step. */
export function stepMatches(step: FilterStep, filter: StepFilter, spawned: ReadonlyMap<string, string>): boolean {
  if (!ofType(step, filter.type, spawned)) return false;
  if (filter.errors && !failed(step)) return false;
  const text = filter.text.trim().toLowerCase();
  if (text === '') return true;
  return [step.text, step.call?.toolName, step.call?.displayName].some((one) => typeof one === 'string' && one.toLowerCase().includes(text));
}

/** What a filter keeps of a turn: its message, each response part by its place, and the counts. */
export interface TurnMatch {
  message: boolean;
  parts: readonly boolean[];
  /** The steps kept. */
  count: number;
  /** The turn's steps: its message and each part that draws. */
  total: number;
}

/** What a filter keeps of a turn. */
export function matchTurn(turn: Turn | ActiveTurn, filter: StepFilter, spawned: ReadonlyMap<string, string>): TurnMatch {
  const message = stepMatches({ kind: 'message', text: turn.message.text, source: turn.message }, filter, spawned);
  let total = 1;
  const parts = turn.responseParts.map((part) => {
    const step = stepOf(part);
    if (step === null) return false;
    total += 1;
    return stepMatches({ ...step, source: part }, filter, spawned);
  });
  return { message, parts, count: (message ? 1 : 0) + parts.filter(Boolean).length, total };
}

/** Each session's filter while the page is open, by the session's key. */
const kept = new Map<string, StepFilter>();

/**
 * A session's filter, `null` while closed, kept by `key` while the page is
 * open so the session finds it again when its tab comes back.
 */
export function useKeptFilter(key: string | undefined): [StepFilter | null, (next: StepFilter | null) => void] {
  const [held, setHeld] = useState<{ key: string | undefined; filter: StepFilter | null }>(() => ({ key, filter: key === undefined ? null : kept.get(key) ?? null }));
  const filter = held.key === key ? held.filter : key === undefined ? null : kept.get(key) ?? null;
  const set = useCallback((next: StepFilter | null): void => {
    if (key !== undefined) {
      if (next === null) kept.delete(key);
      else kept.set(key, next);
    }
    setHeld({ key, filter: next });
  }, [key]);
  return [filter, set];
}
