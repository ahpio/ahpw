---
title: A client says what it is
domain: hosts
status: active
priority: medium
created: 2026-11-19
revalidated: 2026-11-19
requires: []
changes: []
creates: []
decisions: []
refs:
  - git://6d6d4ca - the last commit that holds the brief `briefs/a-client-says-what-it-is.md`, which this plan and ahpc's `ahp/20261119-2156-ahpc-says-what-it-is` cover
  - npm://@microsoft/agent-host-protocol@1.0.0 - `AhpClient.initialize` drops `clientInfo`; `MultiHostClient` takes a stored id, else a bare UUID
  - "[code://src/bridges/protocol-versions.ts#L43-L76](../../../../src/bridges/protocol-versions.ts#L43-L76) - `offeringEveryVersion` and `offering`, the rewrite of `initialize` that gains `clientInfo`"
  - "[code://src/bridges/client-ids.ts](../../../../src/bridges/client-ids.ts) - `localClientIds`, the store that makes and keeps `ahpw-<uuid>`"
  - "[code://src/lib/api.ts#L28-L65](../../../../src/lib/api.ts#L28-L65) - `readServer` and the facts it keeps from `ahpw.json`, the pattern for the client facts"
  - "[code://src/shell/embed/index.ts#L97-L138](../../../../src/shell/embed/index.ts#L97-L138) - `Embedder`, which gains an optional `client`"
  - "[code://cli/serve.ts#L19-L70](../../../../cli/serve.ts#L19-L70) - `serveFields` and `Settings`, a flag and a config key for each setting"
  - "[code://cli/server.ts#L28-L36](../../../../cli/server.ts#L28-L36) - the `ahpw.json` that `ahpw serve` answers"
  - "[code://plugin/index.ts#L17-L30](../../../../plugin/index.ts#L17-L30) - the `ahpw.json` that the ahpd plugin answers"
  - "[code://vite.config.ts#L38-L56](../../../../vite.config.ts#L38-L56) - the dev server's `ahpw.json`, and where the build defines the version"
  - "[code://src/resources/clients/rows.ts#L105-L109](../../../../src/resources/clients/rows.ts#L105-L109) - the Clients row draws the title, else the name, else the id"
---

## Goal

ahpw tells a host what it is, as VS Code does.
Its `initialize` carries a name, a title and ahpw's version.
A Clients row then reads "ahpw", "ahpd web" or "ahp-desk" in place of a bare id.
Each of `ahpw serve`, the ahpd plugin and the desktop app has its own default name and title, and a setting for each.
ahpw's client id becomes `ahpw-<uuid>`.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.
The brief at `git://6d6d4ca` holds the verified facts and VS Code's reference.

### Searches performed

- `rg -n "clientInfo" src cli plugin` - nothing: ahpw sends none.
- `rg -n "async initialize" node_modules/@microsoft/agent-host-protocol/dist/client/client.js` - the request is built from `clientId`, `protocolVersions`, `initialSubscriptions` and `locale` only.
- `rg -n "resolved = stored" node_modules/@microsoft/agent-host-protocol/dist/client/hosts/multi.js` - the stored id, else `generateClientId()`.
- `rg -n "readServer\(\)" src` - `restoreSession` reads `ahpw.json` before any host connects, and only without an embedder.
- `rg -n "version" vite.config.ts` - no version is given to the page.

### Runtime path

```
ahpw.json or Embedder.client -> clientInfoOf() -> offering() rewrites initialize -> ahpd keeps clientInfo -> Clients row heading
localClientIds.load() -> ahpw-<uuid> -> initialize clientId
```

### Gaps

- `initialize` has no `clientInfo`.
- `ahpw.json` and the `Embedder` carry no client name or title.
- `ahpw serve` and the ahpd plugin have no setting for them.
- The page has no version of its own.
- A new id is a bare UUID.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw sends a name, a title and a version in `clientInfo` | Softov, 2026-11-19: "write a brief for both" | 01 |
| The name and the title are set by config, by where ahpw runs | Softov, 2026-11-19: "Allow it support config, so when using ahpw pure it can be ahpw. When as plugin for ahpd or when using onto the desktop it can assume another info" | 02 |
| The name and the title both change by where ahpw runs | Softov, 2026-11-19: "Name and title" | 01, 02 |
| The defaults are `ahpw`, `ahpd web` and `ahp-desk` | Softov, 2026-11-19: "ahpw / ahpd web / ahp-desk" | 01, 02 |
| The version is ahpw's `package.json` version | Softov, 2026-11-19: "Both send a version" | 01 |
| ahpw ids are `ahpw-<uuid>` | Softov, 2026-11-19: "write a brief for both, ahpw-<uuid> ids" | 03 |
| A stored id that is not `ahpw-<uuid>` is replaced once | Softov, 2026-11-19: "Replace it once" | 03 |
| The names are `ahpw`, `ahpd-web` and `ahp-desk` | (defaulted: the titles' words, in the form of a package name) | 01, 02 |
| The settings are `clientName` and `clientTitle`, in `serve` and in the plugin | (defaulted: one spelling in both, as `serve`'s keys are camel case) | 02 |
| `ahpw.json` carries them as `client: { name, title }` | (defaulted: the field the page reads beside `tokenHeld`) | 01, 02 |
| The desktop app's `Embedder` gives them as an optional `client: { name?, title? }` | (defaulted: ahp-desk works unchanged without it) | 01 |
| A name or title the server gives alone takes the other from the defaults | (defaulted: a half setting is not an empty one) | 01 |
| The version is given to the page by a Vite `define` | (defaulted: the page has no other way to know it) | 01 |
| The id is `ahpw-` and `newId()`, which works outside a secure context | [`code://src/bridges/words.ts#L8`](../../../../src/bridges/words.ts#L8) | 03 |

## Proposed architecture

- **Data flow** - the server's `ahpw.json` or the `Embedder` names the client. `clientInfoOf()` folds that over the defaults and the build's version. `offering()` adds it to `initialize`.
- **State flow** - `readServer` keeps `client` from `ahpw.json` beside `tokenHeld` and `daemon`. `localClientIds` keeps the id in `localStorage` as today.
- **Layer responsibilities** - `src/bridges`: the client info and the id · `src/lib/api.ts`: what the server said · `cli/`: `serve`'s settings · `plugin/`: the plugin's options.
- **Source-of-truth files** - `src/bridges/client-info.ts`, new, beside [`code://src/bridges/protocol-versions.ts`](../../../../src/bridges/protocol-versions.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - initialize carries the client info](task-01-initialize-carries-the-client-info.md) | done | - |
| [02 - serve and the plugin name the client](task-02-serve-and-the-plugin-name-the-client.md) | done | 01 |
| [03 - a client id is ahpw-uuid](task-03-a-client-id-is-ahpw-uuid.md) | done | - |

## Risks and tradeoffs

- Each browser with a stored bare UUID comes back once as a new client, with no resume. Its sessions stay; only the connection is new.
- `ahp-desk` gets its defaults from ahpw until it sets `client` itself.
- ahpd keeps one `clientInfo` per client id. A page that reconnects sends none, and ahpd keeps what `initialize` gave.

## Resume state

- **Done so far:** tasks 01, 02 and 03, built on 2026-11-19.
- **Next action:** the PR, then Softov's check, then `implemented.md`.
- **Open questions:** none.
- **Watch out for:** the library's `initialize` drops `clientInfo`, so it is added in the transport rewrite, never passed to the library.

## Final verification checklist

- [ ] A page from `ahpw serve` shows as "ahpw" in the Clients list, with ahpw's version.
- [ ] A page from the ahpd plugin shows as "ahpd web".
- [ ] A page in ahp-desk shows as "ahp-desk".
- [ ] A `clientName` and `clientTitle` set in `serve`'s config and in the plugin's options show in its row.
- [ ] Each ahpw row's client id starts with `ahpw-`, and a reload keeps the same id.
- [ ] `pnpm typecheck` and the test suite pass.
