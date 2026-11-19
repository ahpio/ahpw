---
title: Initialize carries the client info
status: done
depends: []
layer: "bridges"
refs:
  - "[code://src/bridges/protocol-versions.ts#L43-L76](../../../../src/bridges/protocol-versions.ts#L43-L76) - the rewrite of `initialize` that gains `clientInfo`"
  - "[code://src/lib/api.ts#L28-L65](../../../../src/lib/api.ts#L28-L65) - `readServer`, which keeps `client` from `ahpw.json`"
  - "[code://src/shell/embed/index.ts#L97-L138](../../../../src/shell/embed/index.ts#L97-L138) - `Embedder`, which gains an optional `client`"
  - "[code://vite.config.ts#L55](../../../../vite.config.ts#L55) - the build that defines ahpw's version"
---

## Objective

Every `initialize` ahpw sends carries `clientInfo: { name, title, version }`.
The name and the title come from the `Embedder`'s `client` or from `ahpw.json`'s `client`, over the defaults: `ahp-desk` in an embedder, `ahpw` elsewhere.

## Files

- `CREATE: src/bridges/client-info.ts` - `clientInfoOf()`, the defaults, and the build's version.
- `CREATE: src/bridges/client-info.test.ts` - cases of each source and of the defaults.
- `UPDATE: src/bridges/protocol-versions.ts:43-76` - `offeringEveryVersion` adds `clientInfo` to `initialize`; `offering` passes `clientInfoOf()`.
- `UPDATE: src/bridges/protocol-versions.test.ts` - an `initialize` with `clientInfo`, and a `reconnect` without it.
- `UPDATE: src/lib/api.ts:28-65` - `readServer` keeps `client` from `ahpw.json`; `servedClient()` returns it.
- `UPDATE: src/shell/embed/index.ts:97-138` - `Embedder` gains `client?: { name?: string; title?: string }`.
- `UPDATE: vite.config.ts:55` - `define` gives `__AHPW_VERSION__` from `package.json`.
- `UPDATE: CHANGELOG.md` - a line under *Unreleased*, *Added*.

## Steps

1. Add `client?: { name?: string; title?: string }` to `Embedder`, with a comment that says what a Clients row shows.
2. In `readServer`, keep a `client` object of `ahpw.json` with string `name` and `title` only, and clear it on a failure.
3. Export `servedClient()` from `src/lib/api.ts`, which returns that object or undefined.
4. In `vite.config.ts`, read `version` from `package.json` and define `__AHPW_VERSION__` as its JSON string.
5. In `client-info.ts`, declare `__AHPW_VERSION__` and export `clientInfoOf()`.
6. Make `clientInfoOf()` take the embedder's `client` in an embedder, else `servedClient()`.
7. Fill a missing `name` or `title` from the defaults: `ahp-desk` in an embedder, `ahpw` elsewhere.
8. Add `version: __AHPW_VERSION__` to the result.
9. Give `offeringEveryVersion` a `clientInfo` argument, and add it to an `initialize` only.
10. Pass `clientInfoOf()` from `offering`.
11. Add the cases and the changelog line.

## Validation

- Check these cases in `client-info.test.ts`:
  - No embedder and no `ahpw.json` client give `ahpw`.
  - An embedder with no `client` gives `ahp-desk`.
  - A name with no title takes the default title.
  - The version is the version in `package.json`.
- `protocol-versions.test.ts`: an `initialize` carries the given `clientInfo`; a `reconnect` and any other frame carry none.
- `pnpm typecheck` and `pnpm test` pass.

## Resume

Built on 2026-11-19. `clientInfoFrom` folds a given client over a default field by field, and `clientInfoOf` picks the source.
`ahpw.json` is read before the first `initialize`, as `openSocket` already needs `serverHoldsToken()`.
On the test daemon, a page from `ahpw serve` arrived as `ahpw`, with version `0.9.0-rc.3`.

