---
title: The bridge installs, writes and removes
status: todo
depends: []
layer: "ahpw bridges"
refs:
  - "[code://src/bridges/plugins.ts#L24-L32](../../../../src/bridges/plugins.ts#L24-L32) - `PLUGINS`, which gets the three command names"
  - "[code://src/bridges/plugins.ts#L143-L145](../../../../src/bridges/plugins.ts#L143-L145) - `reloadPlugin`, the call shape to copy"
  - "[code://src/bridges/plugins.test.ts](../../../../src/bridges/plugins.test.ts) - the bridge tests, with a fake host"
---

## Objective

The plugins bridge sends `x-ahpd/plugins/install`, `x-ahpd/plugins/write` and `x-ahpd/plugins/remove`, and reads each answer.

## Files

- `UPDATE: src/bridges/plugins.ts:24-32` - `PLUGINS` gets `install`, `write` and `remove`.
- `UPDATE: src/bridges/plugins.ts` - `installPlugin`, `writePlugin` and `removePlugin`, and the `PluginAdded` answer type.
- `UPDATE: src/bridges/plugins.test.ts` - the params each call sends and the answer each reads.

## Steps

1. Add `install`, `write` and `remove` to `PLUGINS`, as `x-ahpd/plugins/<name>`.
2. Add `PluginAdded`, `{ id: string; restart: boolean }`, with `restart` false when the host leaves it out.
3. Write `installPlugin(host, source)`, which sends `{ source }` and answers a `PluginAdded`.
4. Write `writePlugin(host, id, source, packageJson)`, which sends the three as given and answers a `PluginAdded`.
5. Write `removePlugin(host, id, keep)`, which sends `{ id }`, and `keep: true` only when `keep` is true.
6. Refuse an answer that names no `id`, as `enable` does.
7. Add tests for each call's params, its answer, and an answer with no `id`.

## Validation

- `src/bridges/plugins.test.ts` holds the cases of step 7.
- `pnpm typecheck` passes.
- `pnpm vitest run src/bridges/plugins.test.ts` passes.

## Resume
