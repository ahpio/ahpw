import type { SessionState, SessionToolClientExecutionRequest, StateAction, ToolCallResult } from '@microsoft/agent-host-protocol';
import type { Scena } from '@softov/scena/types';
import { translate } from '@softov/scena';
import { hostBridge } from '../../bridges/data.js';
import { done, tryNotify } from '../../shell/notify/index.js';
import { EMOJIcon } from '../emojis.js';
import { askKey, dropAsk, raiseAsk, type Ask } from './asks.js';
import { commandTitle, modeOf, setMode, SHOW_ASK } from './registry.js';
import { commandOf, refused, runTool } from './tools.js';

/** Runs the calls of one session while this window holds its lock. */
export interface Runner {
  /** The session as it is now, and whether this window runs its calls. */
  update(needed: SessionState['inputNeeded'], own: string | undefined, holds: boolean): void;
  release(): void;
}

/** The session page the calls are drawn on. */
export interface Place {
  title(): string;
  /** Whether a person is looking at this chat. */
  inView(chat: string): boolean;
  /** Shows this chat on the page. */
  show(chat: string): void;
  /** The session, for a toast that opens it. */
  resource: string;
}

/** A call's input: inline, or behind a reference the host serves. */
async function inputOf(host: string, call: SessionToolClientExecutionRequest['toolCall']): Promise<unknown> {
  const raw = call.toolInput;
  if (raw === undefined) return {};
  const text = typeof raw === 'string' ? raw : (await hostBridge(host).readText(raw.uri)).text ?? '';
  return text.trim() === '' ? {} : JSON.parse(text);
}

async function resultOf(scena: Scena, host: string, title: () => string, call: SessionToolClientExecutionRequest['toolCall']): Promise<ToolCallResult> {
  try {
    const input = await inputOf(host, call);
    const id = commandOf(call.toolName, input);
    // Read before it runs: the command may change what is on screen.
    const mode = id === undefined ? 'off' : modeOf(scena, id);
    const result = await runTool(scena, host, call.toolName, input);
    if (id !== undefined && (mode === 'notify' || mode === 'ask') && result.success) done(translate('sessions/agentTools/ran', { command: commandTitle(scena, id) }), { description: title(), source: `agentTools:${call.toolCallId}` });
    return result;
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Answers each call once. A call has a lock of its own, held until the host
 * drops the call: a window that takes the session over while a call still
 * runs does not run it again.
 *
 * A call to a command set to ask waits in every window with the session open,
 * and runs in the one where a person allows it.
 */
export function makeRunner(scena: Scena, locks: LockManager, host: string, place: Place): Runner {
  /** The calls this window took, and what lets each one's lock go. */
  const taken = new Map<string, () => void>();
  /** The command each open call names, read once: undefined for a call that names none. */
  const commands = new Map<string, { id: string | undefined }>();
  const reading = new Set<string>();
  const asking = new Map<string, Ask>();
  /** The asks a toast was shown for. */
  const toasted = new Set<string>();
  let latest: Parameters<Runner['update']> = [undefined, undefined, false];
  let over = false;

  const take = (entry: SessionToolClientExecutionRequest, result: () => Promise<ToolCallResult>): void => {
    if (taken.has(entry.id)) return;
    let letGo = (): void => {};
    const dropped = new Promise<void>((resolve) => { letGo = resolve; });
    taken.set(entry.id, letGo);
    void locks.request(`ahpw.agentTools.call:${host}:${entry.id}`, { ifAvailable: true }, async (lock) => {
      if (lock === null) {
        // Another window has it. Tried again if the call is still open on a later change.
        if (taken.get(entry.id) === letGo) taken.delete(entry.id);
        return;
      }
      const answer = await result();
      hostBridge(host).dispatch(entry.chat, { type: 'chat/toolCallComplete', turnId: entry.turnId, toolCallId: entry.toolCall.toolCallId, result: answer } as StateAction);
      await dropped;
    });
  };
  const run = (entry: SessionToolClientExecutionRequest) => () => resultOf(scena, host, place.title, entry.toolCall);
  const toastId = (id: string): string => `agentTools.ask:${host}:${id}`;

  const stopAsking = (id: string): void => {
    const ask = asking.get(id);
    if (ask === undefined) return;
    asking.delete(id);
    dropAsk(ask);
    if (toasted.delete(id)) tryNotify((notifications) => notifications.dismiss(toastId(id)));
  };

  const ask = (entry: SessionToolClientExecutionRequest, command: string): void => {
    const made: Ask = {
      host,
      chat: entry.chat,
      toolCallId: entry.toolCall.toolCallId,
      title: commandTitle(scena, command),
      answer: (allow) => {
        stopAsking(entry.id);
        take(entry, allow ? run(entry) : async () => refused('The user denied it.'));
      },
      always: () => {
        setMode(scena, command, 'notify');
        for (const [id, one] of [...asking]) if (commands.get(id)?.id === command) one.answer(true);
      },
      show: () => place.show(entry.chat),
    };
    asking.set(entry.id, made);
    raiseAsk(made);
  };

  const toast = (entry: SessionToolClientExecutionRequest, one: Ask): void => {
    toasted.add(entry.id);
    tryNotify((notifications) => notifications.publish({
      id: toastId(entry.id),
      source: toastId(entry.id),
      type: 'attention',
      tone: 'warning',
      icon: EMOJIcon.warning,
      title: translate('sessions/agentTools/asks', { command: one.title }),
      description: place.title(),
      dismissAuto: false,
      actions: [{ label: translate('sessions/alerts/open'), command: SHOW_ASK, args: { host, resource: place.resource, key: askKey(host, entry.chat, entry.toolCall.toolCallId) } }],
    }));
  };

  /** The command a call names; undefined while an input held by reference is read. */
  const commandFor = (entry: SessionToolClientExecutionRequest): { id: string | undefined } | undefined => {
    const known = commands.get(entry.id);
    if (known !== undefined) return known;
    const { toolInput, toolName } = entry.toolCall;
    if (toolInput === undefined || typeof toolInput === 'string') {
      let input: unknown;
      // An input that does not parse is refused where the call runs.
      try { input = JSON.parse(toolInput ?? '{}'); } catch { input = undefined; }
      const read = { id: commandOf(toolName, input) };
      commands.set(entry.id, read);
      return read;
    }
    if (!reading.has(entry.id)) {
      reading.add(entry.id);
      inputOf(host, entry.toolCall).then((input) => commandOf(toolName, input), () => undefined).then((id) => {
        reading.delete(entry.id);
        commands.set(entry.id, { id });
        if (!over) update(...latest);
      });
    }
    return undefined;
  };

  const update: Runner['update'] = (needed, own, holds) => {
    latest = [needed, own, holds];
    const open = (needed ?? []).filter((one): one is SessionToolClientExecutionRequest => String(one.kind) === 'toolClientExecution' && (one as SessionToolClientExecutionRequest).clientId === own);
    const ids = new Set(open.map((one) => one.id));
    for (const [id, letGo] of taken) {
      if (ids.has(id)) continue;
      taken.delete(id);
      letGo();
    }
    for (const id of [...asking.keys()]) if (!ids.has(id)) stopAsking(id);
    for (const id of [...commands.keys()]) if (!ids.has(id)) commands.delete(id);
    if (own === undefined) return;
    for (const entry of open) {
      if (taken.has(entry.id)) continue;
      const command = commandFor(entry);
      if (command === undefined) continue;
      if (!asking.has(entry.id)) {
        if (command.id === undefined || modeOf(scena, command.id) !== 'ask') {
          if (holds) take(entry, run(entry));
          continue;
        }
        ask(entry, command.id);
      }
      // One window says it: the one that runs the session's calls.
      if (holds && !toasted.has(entry.id) && !place.inView(entry.chat)) toast(entry, asking.get(entry.id)!);
    }
  };

  return {
    update,
    release() {
      over = true;
      for (const id of [...asking.keys()]) stopAsking(id);
      for (const letGo of taken.values()) letGo();
      taken.clear();
    },
  };
}
