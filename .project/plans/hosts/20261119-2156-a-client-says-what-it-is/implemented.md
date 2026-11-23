---
title: A client says what it is - implemented
date: 2026-11-22
refs:
  - git://deadb7b - the merge of ahpw #104
  - "[code://src/bridges/client-info.ts](../../../../src/bridges/client-info.ts) - `clientInfoOf` and its defaults"
  - "[code://src/bridges/client-ids.ts](../../../../src/bridges/client-ids.ts) - the `ahpw-<uuid>` client id"
  - "[code://cli/serve.ts](../../../../cli/serve.ts) - `--client-name` and `--client-title`"
---

A page tells the host its name, title and version in `initialize`, and its client id is `ahpw-<uuid>`. `ahpw serve` and the plugin can name the client.

## What was built

- [`code://src/bridges/client-info.ts`](../../../../src/bridges/client-info.ts) - `clientInfoOf`, `clientInfoFrom` and the build's version, added to `initialize` in the transport.
- [`code://cli/serve.ts`](../../../../cli/serve.ts) - `--client-name` and `--client-title`, with config keys; a blank value takes the default.
- [`code://src/bridges/client-ids.ts`](../../../../src/bridges/client-ids.ts) - `load` returns the stored `ahpw-<uuid>`, or a new one.

## Verified

- On the test daemon, a page from `ahpw serve` arrived as `ahpw`, with version `0.9.0-rc.3`.
- There, `--client-title "Check page"` showed as the row's title, and a reload kept the same `ahpw-` id.
- `client-info.test.ts`, `serve.test.ts` and `client-ids.test.ts` cover each source, the flags and the ids.

## Departures from the plan

- The library's `initialize` drops `clientInfo`, so it is added in the transport rewrite.
- `load` returns a new id without storing it, because the protocol stores what `load` returns.

## Left for later

- None.
