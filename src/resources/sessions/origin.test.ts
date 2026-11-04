import { describe, expect, it } from 'vitest';
import type { Message } from '@microsoft/agent-host-protocol';
import { askOf, firstLine } from './origin.js';

const SESSION = 'ahp-session:/one';

/** A message as the host sends it; `origin.kind` is a plain string, as on the wire. */
const message = (fields: { text?: string; origin?: { kind: string }; _meta?: Record<string, unknown> }): Message =>
  ({ text: 'hello', origin: { kind: 'user' }, ...fields }) as unknown as Message;

describe('askOf', () => {
  it('draws a user message as a bubble', () => {
    expect(askOf(message({}), SESSION)).toEqual({ kind: 'bubble' });
  });

  it('draws a system notification as its first line', () => {
    const said = message({ text: '\nThe background shell command ended with exit code 0.\n\nThe command:\npnpm test', origin: { kind: 'systemNotification' } });
    expect(askOf(said, SESSION)).toEqual({ kind: 'notice', line: 'The background shell command ended with exit code 0.' });
  });

  it('draws the label the host gave a system notification', () => {
    const said = message({ text: 'a long prompt', origin: { kind: 'systemNotification' }, _meta: { 'vscode.chat.systemInitiatedLabel': 'Moved to the worktree' } });
    expect(askOf(said, SESSION)).toEqual({ kind: 'notice', line: 'Moved to the worktree' });
  });

  it('draws nothing for a message hidden from the transcript', () => {
    const said = message({ origin: { kind: 'systemNotification' }, _meta: { 'vscode.chat.requestHiddenFromTranscript': true } });
    expect(askOf(said, SESSION)).toEqual({ kind: 'hidden' });
  });

  it('names another chat of the same session as the source', () => {
    const said = message({ origin: { kind: 'agent' }, _meta: { 'vscode.chat.delegation': { sourceSession: SESSION, sourceChat: 'ahp-chat:/one/2' } } });
    expect(askOf(said, SESSION)).toEqual({ kind: 'bubble', from: { session: SESSION, chat: 'ahp-chat:/one/2', scope: 'chat' } });
  });

  it('names another session as the source', () => {
    const said = message({ origin: { kind: 'agent' }, _meta: { 'vscode.chat.delegation': { sourceSession: 'ahp-session:/two' } } });
    expect(askOf(said, SESSION)).toEqual({ kind: 'bubble', from: { session: 'ahp-session:/two', scope: 'session' } });
  });

  it('keeps the bubble for an origin it does not know', () => {
    expect(askOf(message({ origin: { kind: 'somethingNew' } }), SESSION)).toEqual({ kind: 'bubble' });
  });

  it('ignores a delegation entry without a session', () => {
    expect(askOf(message({ _meta: { 'vscode.chat.delegation': { sourceChat: 'ahp-chat:/x' } } }), SESSION)).toEqual({ kind: 'bubble' });
  });
});

describe('firstLine', () => {
  it('skips blank lines', () => {
    expect(firstLine('\n  \n  first \nsecond')).toBe('first');
  });
});
