---
title: The mark, the modes and the two tools
status: done
depends: []
layer: "resources"
refs:
  - "[code://src/shell/dock/settings.ts#L137-L151](../../../../src/shell/dock/settings.ts#L137-L151) - the generated `ui.` settings to copy"
  - "[code://src/shell/ui-settings/settings.ts#L73](../../../../src/shell/ui-settings/settings.ts#L73) - `UI_SETTINGS`"
---

## Objective

ahpw has a registry of commands marked as tools, a mode per marked command, and the two tools `listCommands` and `runCommand` as pure logic.

## Files

- `CREATE: src/resources/agent-tools/registry.ts` - `serveAsTool(id, { text, input })`, the marks, and `ui.agentTools.<id>` settings with off, run and notify, usual off.
- `CREATE: src/resources/agent-tools/check.ts` - checks a value against the JSON Schema subset: object, string, number, integer, boolean, `enum`, `required`, and `description` ignored.
- `CREATE: src/resources/agent-tools/tools.ts` - the `ToolDefinition` of `listCommands` and `runCommand`, and `runTool(name, input, from)`, which returns a `ToolCallResult`.
- `UPDATE: src/shell/ui-settings/settings.ts:141` - add the tool settings after `DOCK_SETTINGS`.
- `CREATE: src/resources/agent-tools/agent-tools.test.ts` - the cases in *Validation*.

## Steps

1. Write `serveAsTool`, which keeps the command id, the model text and the input schema, and returns a `Disposable`.
2. Generate one `ui.agentTools.<id>` setting per mark, as `DOCK_SETTINGS` does, with the mode kept in the browser.
3. Write `check`, which returns the first field that fails, or nothing.
4. Write `listCommands`, which returns each mark whose mode is not off: the id, the text and the input schema.
5. Write `runCommand`, which takes `id` and `args`, refuses an id that is off or not marked, and checks `args`.
6. In `runCommand`, put the calling session's host in `args.host` when the schema has `host` and the call has none.
7. Run the command with scena's `execute`, and return its outcome as a `ToolCallResult`.
8. Add the tool settings to `UI_SETTINGS`.
9. Write the tests.

## Validation

- A command with no mark, or a mode of off, is not in `listCommands`, and `runCommand` refuses it.
- `runCommand` with a missing required field returns a failed result that names the field.
- `runCommand` without `host` passes the calling session's host.
- Every `ui.agentTools.` setting starts at off.
- `pnpm typecheck` and `pnpm vitest run src/resources/agent-tools` pass.

## Resume
