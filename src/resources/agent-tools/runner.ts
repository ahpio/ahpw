import type { SessionState, SessionToolClientExecutionRequest, StateAction, ToolCallResult } from '@microsoft/agent-host-protocol';
import type { Scena } from '@softov/scena/types';
import { translate } from '@softov/scena';
import { hostBridge } from '../../bridges/data.js';
import { done } from '../../shell/notify/index.js';
import { commandTitle, modeOf } from './registry.js';
import { commandOf, refused, runTool } from './tools.js';

/** Runs the calls of one session while this window holds its lock. */
export interface Runner {
  /** The session as it is now, and whether this window runs its calls. */
  update(needed: SessionState['inputNeeded'], own: string | undefined, holds: boolean): void;
  release(): void;
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
    const notify = id !== undefined && modeOf(scena, id) === 'notify';
    const result = await runTool(scena, host, call.toolName, input);
    if (notify && result.success) done(translate('sessions/agentTools/ran', { command: commandTitle(scena, id) }), { description: title(), source: `agentTools:${call.toolCallId}` });
    return result;
  } catch (error) {
    return refused(error instanceof Error ? error.message : String(error));
  }
}

/**
 * Answers each call once. A call has a lock of its own, held until the host
 * drops the call: a window that takes the session over while a call still
 * runs does not run it again.
 */
export function makeRunner(scena: Scena, locks: LockManager, host: string, title: () => string): Runner {
  /** The calls this window took, and what lets each one's lock go. */
  const taken = new Map<string, () => void>();
  const run = async (entry: SessionToolClientExecutionRequest): Promise<void> => {
    const result = await resultOf(scena, host, title, entry.toolCall);
    hostBridge(host).dispatch(entry.chat, { type: 'chat/toolCallComplete', turnId: entry.turnId, toolCallId: entry.toolCall.toolCallId, result } as StateAction);
  };
  return {
    update(needed, own, holds) {
      const open = (needed ?? []).filter((one): one is SessionToolClientExecutionRequest => String(one.kind) === 'toolClientExecution' && (one as SessionToolClientExecutionRequest).clientId === own);
      const ids = new Set(open.map((one) => one.id));
      for (const [id, letGo] of taken) {
        if (ids.has(id)) continue;
        taken.delete(id);
        letGo();
      }
      if (!holds || own === undefined) return;
      for (const entry of open) {
        if (taken.has(entry.id)) continue;
        let letGo = (): void => {};
        const over = new Promise<void>((resolve) => { letGo = resolve; });
        taken.set(entry.id, letGo);
        void locks.request(`ahpw.agentTools.call:${host}:${entry.id}`, { ifAvailable: true }, async (lock) => {
          if (lock === null) {
            // Another window has it. Tried again if the call is still open on a later change.
            if (taken.get(entry.id) === letGo) taken.delete(entry.id);
            return;
          }
          await run(entry);
          await over;
        });
      }
    },
    release() {
      for (const letGo of taken.values()) letGo();
      taken.clear();
    },
  };
}
