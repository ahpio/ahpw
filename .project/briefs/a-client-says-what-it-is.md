---
title: A client says what it is
created: 2026-11-19
refs:
  - git://062730f - the commit of ahpw the facts were checked at
  - git://903c5d2 - the commit of ahpc the facts were checked at
  - git://3f0a31c14 - the commit of ahpd the facts were checked at
  - git://1564f100807a - the commit of VS Code the reference was checked at
  - npm://@microsoft/agent-host-protocol@1.0.0 - the client library ahpw connects through; 1.1.0, which ahpc uses, is the same here
  - "[code://src/bridges/protocol-versions.ts#L43-L76](../../src/bridges/protocol-versions.ts#L43-L76) - `offeringEveryVersion` and `offering`, which rewrite `initialize` on its way out"
  - "[code://src/bridges/client-ids.ts](../../src/bridges/client-ids.ts) - `localClientIds`, one client id per host in `localStorage`"
  - "[code://src/bridges/data.ts#L942](../../src/bridges/data.ts#L942) - `new MultiHostClient({ clientIdStore: localClientIds })`"
  - "[code://src/lib/api.ts#L46-L65](../../src/lib/api.ts#L46-L65) - `readServer`, which reads `ahpw.json` from the server that sent the page"
  - "[code://cli/server.ts#L32](../../cli/server.ts#L32) - what `ahpw serve` answers in `ahpw.json`"
  - "[code://plugin/index.ts#L22](../../plugin/index.ts#L22) - what the ahpd plugin answers in `ahpw.json`"
  - "[code://src/shell/embed/index.ts#L97](../../src/shell/embed/index.ts#L97) - `Embedder`, what the desktop app gives ahpw"
  - "[code://src/resources/clients/rows.ts#L105-L109](../../src/resources/clients/rows.ts#L105-L109) - a Clients row's heading and its client words"
---

# A client says what it is

A Clients row names VS Code as "VS Code Agents Window", and names ahpw and ahpc only by their client id.
Softov wants ahpw and ahpc to send a name, a title and a version, as VS Code sends its name and title.
ahpw sends a different name and title from `ahpw serve`, from the ahpd plugin and in the desktop app.
A setting changes each, and the defaults tell the three apart.
Both clients also make their ids in one format, `<app>-<uuid>`: `ahpw-<uuid>` and `ahpc-<uuid>`.

## What others do

- The protocol carries the name in `InitializeParams.clientInfo`, an `Implementation` of `name`, an optional `version` and an optional `title`. It is informational only. `clientId` is an opaque identifier for reconnection, not a name.
- VS Code sends `{ name: 'vscode-editor-window', title: 'VS Code' }` from an editor window and `{ name: 'vscode-agents-window', title: 'VS Code Agents Window' }` from the Agents window, with no version. One codebase sends two names by where it runs. The values are in `src/vs/platform/agentHost/common/agentHostClientInfo.ts` at the VS Code commit in `refs`.
- VS Code's client id is a bare UUID, `generateUuid()`, in `src/vs/platform/agentHost/electron-browser/localAgentHostService.ts`.

## What ahpw and ahpc have today

- ahpd keeps the `name`, `version` and `title` of `clientInfo` in `packages/sdk/src/host/handshake.ts:346` and after.
  ahpw draws the title as a row's heading, else the name, else the id ([`code://src/resources/clients/rows.ts`](../../src/resources/clients/rows.ts#L105)).
- The client library's `AhpClient.initialize` builds the request from `clientId`, `protocolVersions`, `initialSubscriptions` and `locale` only. It drops `clientInfo`, in 1.0.0 and in 1.1.0.
- ahpw sends no `clientInfo`. Its `initialize` comes from the library's host runtime, which passes no `clientInfo` to `initialize`.
- ahpw already rewrites `initialize` on its way out, to offer every protocol version and its locale ([`code://src/bridges/protocol-versions.ts`](../../src/bridges/protocol-versions.ts#L43)).
- ahpc passes `clientInfo: { name: 'ahpc' }` to `initialize` (`src/ahp/live.ts:1780`, and the reconnect fallback at `:2077`). The library drops it, so the host never gets a name from ahpc. This is why the ahpc rows show only the id.
- ahpc reads its own version from `package.json` (`version()` in `src/version.ts:43`). ahpw has no version at build time: `vite.config.ts` defines none.
- ahpc's id is `ahpc-` plus the first 8 hex characters of a UUID, new for each process (`src/ahp/live.ts:1649`).
- ahpw's id is a bare UUID. `MultiHostClient` takes the stored id, else `generateClientId()`. `localClientIds` keeps it per host in `localStorage` under `ahpw.clientId.<hostId>`, so a reload resumes the same client ([`code://src/bridges/client-ids.ts`](../../src/bridges/client-ids.ts)).
- ahpw learns how it is served from `ahpw.json` beside the page ([`code://src/lib/api.ts`](../../src/lib/api.ts#L46)). `ahpw serve` answers `{ tokenHeld, daemon }` ([`code://cli/server.ts`](../../cli/server.ts#L32)). The ahpd plugin answers `{ tokenHeld: false }` ([`code://plugin/index.ts`](../../plugin/index.ts#L22)). The Vite dev server answers its own.
- In the desktop app, ahp-desk sets `globalThis.ahpwEmbedder` before ahpw runs ([`code://src/shell/embed/index.ts`](../../src/shell/embed/index.ts#L97)). The `Embedder` has no client name or title.
- `ahpw serve` takes each setting as a flag and as the same key in `~/.config/ahpw/config.json` (`cli/serve.ts`). The ahpd plugin declares no `optionsSchema`.

## Who writes

- No branch of ahpw or ahpc changes `src/bridges/protocol-versions.ts`, `src/bridges/client-ids.ts`, `src/bridges/data.ts` or `src/ahp/live.ts`, checked at the commits in `refs`.
- ahp-desk sets the `Embedder`. A new optional field leaves it working unchanged, and ahpw sends the desktop defaults when ahp-desk gives none.
- ahpd reads `clientInfo` and changes nothing.

## The change

### ahpw

- ahpw adds `clientInfo` to `initialize` in the same rewrite that adds the protocol versions and the locale.
- `clientInfo.version` is ahpw's `package.json` version, given to the page at build time.
- The name and the title come from where ahpw runs:

| Where ahpw runs | Default name | Default title | Where it is set |
|---|---|---|---|
| `ahpw serve` | `ahpw` | `ahpw` | a flag and a config key for each, sent in `ahpw.json` |
| The ahpd plugin | `ahpd-web` | `ahpd web` | a plugin option for each, sent in `ahpw.json` |
| The desktop app | `ahp-desk` | `ahp-desk` | an optional `client` on the `Embedder` |
| The Vite dev server | `ahpw` | `ahpw` | none |

- A new client id is `ahpw-<uuid>`, made by ahpw and kept by `localClientIds` as today.
- A stored id that is not `ahpw-<uuid>` is replaced once by a new `ahpw-<uuid>`. That browser comes back once as a new client, and resumes from then on.

### ahpc

- ahpc's `initialize` carries `clientInfo: { name: 'ahpc', title: 'ahpc', version }`, past the library that drops it, on the first connection and on the reconnect fallback.
- ahpc's id is `ahpc-<uuid>`, still new for each process.

## Answers

| What | Source |
|---|---|
| ahpw ids are `ahpw-<uuid>` | Softov, 2026-11-19: "write a brief for both, ahpw-<uuid> ids" |
| A stored bare UUID is replaced once | Softov, 2026-11-19: "Replace it once" |
| ahpc ids are `ahpc-<uuid>` | Softov, 2026-11-19: "Yes, ahpc-<uuid>" |
| The name and title are set by config, by where ahpw runs | Softov, 2026-11-19: "Allow it support config, so when using ahpw pure it can be ahpw. When as plugin for ahpd or when using onto the desktop it can assume another info" |
| The name and the title both change by where ahpw runs | Softov, 2026-11-19: "Name and title" |
| The defaults are `ahpw`, `ahpd web` and `ahp-desk` | Softov, 2026-11-19: "ahpw / ahpd web / ahp-desk" |
| Both clients send a version | Softov, 2026-11-19: "Both send a version" |
| The names are `ahpw`, `ahpd-web` and `ahp-desk`, and ahpc's title is `ahpc` | (defaulted: the titles' words, in the form of a package name) |
| The brief is in ahpw, which is built first | (defaulted: do-spec puts a brief that spans repositories in the first one built) |
