---
title: A change of state asks first
status: todo
depends: []
layer: "resources/agents, resources/plugins"
refs:
  - "[code://src/resources/agents/actions.ts#L8-L64](../../../../src/resources/agents/actions.ts#L8-L64) - `deleteAgent` asks; `setMode` gets the same question"
  - "[code://src/resources/plugins/actions.ts#L44-L110](../../../../src/resources/plugins/actions.ts#L44-L110) - `installListed`, `togglePlugin` and `reloadOne` get a question"
  - "[code://src/resources/plugins/actions.ts#L66-L72](../../../../src/resources/plugins/actions.ts#L66-L72) - `removeOne`, the plugin question they copy"
  - "[code://src/shell/notify/confirm.ts#L36-L43](../../../../src/shell/notify/confirm.ts#L36-L43) - `ConfirmOptions`: title, body, confirm label and tone"
---

## Objective

Pause, Disable, Resume and Enable on an agent, and Enable, Disable, Reimport and Install on a plugin, ask with `confirm` before they send anything.
They ask from the page and from the explorer menu or row, because the question is in the action function.

## Files

- `UPDATE: src/resources/agents/actions.ts:57-64` - `setMode` asks before `setAgentMode`, and returns on *No*.
- `UPDATE: src/resources/plugins/actions.ts:44-110` - `installListed`, `togglePlugin` and `reloadOne` ask before their request, and return on *No*.
- `UPDATE: src/i18n/en.json` - a title and a body for each question, under `agents/actions/` and `plugins/actions/`.
- `UPDATE: src/i18n/es.json` - the same keys in Spanish.
- `UPDATE: src/i18n/pt.json` - the same keys in Portuguese.
- `UPDATE: src/resources/agents/actions.test.ts` - add cases for `setMode` with *Yes* and *No*.
- `CREATE: src/resources/plugins/actions.test.ts` - cases for each plugin action with *Yes* and *No*.

## Steps

1. In `setMode`, call `confirm` with the mode's title, its body and the mode's own label as `confirmLabel`.
2. Use the `danger` tone for `pause` and `disable`, and the `default` tone for `enable`.
3. Return before `setAgentMode` when `confirm` answers anything but true.
4. In `togglePlugin`, ask with an Enable or a Disable question, by `specEnabled(row.spec)`, in the same tones.
5. In `reloadOne`, ask with a Reimport question in the `default` tone.
6. In `installListed`, ask with an Install question that names the plugin and the version.
7. Ask before `installListed` sets `INSTALLING`.
8. Return `undefined` from `installListed` on *No*, so its callers open no page.
9. Write each title as the verb and the name, as `Pause Ember?`, and each body as one sentence on what changes.
10. Add each key to `en.json`, `es.json` and `pt.json`.
11. Leave `checkOne`, `ahp.newSession` and the host's operations as they are.

## Validation

- `src/resources/agents/actions.test.ts`: `setMode` sends nothing on *No* and sends the mode on *Yes*.
- `src/resources/plugins/actions.test.ts`: each action sends nothing on *No* and sends its request on *Yes*; `installListed` sets no `INSTALLING` mark on *No*.
- `pnpm typecheck` and `pnpm test` pass, with the locale test.
- By hand: each action asks once from its page and once from its explorer menu or row.

## Resume

