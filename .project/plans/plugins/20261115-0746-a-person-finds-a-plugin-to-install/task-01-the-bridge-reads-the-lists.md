---
title: The bridge reads the lists
status: done
depends: []
layer: "ahpw bridges"
refs:
  - "[code://src/bridges/plugins.ts#L25-L36](../../../../src/bridges/plugins.ts#L25-L36) - `PLUGINS`, which gets `available` and `details`"
  - "[code://src/bridges/plugins.ts#L167-L178](../../../../src/bridges/plugins.ts#L167-L178) - `change` and `installPlugin`"
  - "[code://src/bridges/plugins.test.ts](../../../../src/bridges/plugins.test.ts) - the bridge tests, with a fake host"
---

## Objective

The plugins bridge asks `x-ahpd/plugins/available` and `x-ahpd/plugins/details`, and an install names the list it installs from.

## Files

- `UPDATE: src/bridges/plugins.ts` - the two command names, the answer types, `availablePlugins`, `pluginDetails`, and `installPlugin` with a `marketplace`.
- `UPDATE: src/bridges/plugins.test.ts` - the params each call sends and the answer each reads.

## Steps

1. Add `available` and `details` to `PLUGINS`, as `x-ahpd/plugins/<name>`.
2. Write the types of an answer: `ListedVersion`, `ListedPlugin` with `marketplace` and `installed`, `AvailablePlugins` and `PluginDetails`.
3. Write `availablePlugins(host)`, which sends `{}` and answers `{ marketplaces, plugins }`, with empty arrays for a part the host leaves out.
4. Write `pluginDetails(host, id, marketplace?, version?)`, which sends only the params given.
5. Give `installPlugin` an optional `marketplace`, sent only when given.
6. Add tests for each call's params and its answer.

## Validation

- `pnpm vitest run src/bridges/plugins.test.ts` passes.
- `pnpm typecheck` passes.

## Resume

Built on 2026-11-15; awaits review.
`availablePlugins` and `pluginDetails` are in `src/bridges/plugins.ts`, and `installPlugin` takes an optional `marketplace`.
`src/bridges/plugins.test.ts` passes 13 cases.
