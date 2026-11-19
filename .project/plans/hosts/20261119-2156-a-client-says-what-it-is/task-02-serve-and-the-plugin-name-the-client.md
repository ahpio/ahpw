---
title: Serve and the plugin name the client
status: done
depends: [task-01-initialize-carries-the-client-info.md]
layer: "cli, plugin"
refs:
  - "[code://cli/serve.ts#L19-L70](../../../../cli/serve.ts#L19-L70) - `serveFields`, `Settings` and `KINDS`, where the two settings go"
  - "[code://cli/server.ts#L28-L36](../../../../cli/server.ts#L28-L36) - the `ahpw.json` that `ahpw serve` answers"
  - "[code://plugin/index.ts#L17-L30](../../../../plugin/index.ts#L17-L30) - the `ahpw.json` that the ahpd plugin answers"
---

## Objective

`ahpw serve` and the ahpd plugin each take `clientName` and `clientTitle`, and send them in `ahpw.json` as `client`.
`serve` sends `ahpw` by default, and the plugin sends `ahpd-web` and `ahpd web`.

## Files

- `UPDATE: cli/serve.ts:19-70` - `clientName` and `clientTitle` in `serveFields`, `Settings` and `KINDS`, with their defaults in `settingsOf`.
- `UPDATE: cli/server.ts:11-36` - `WebServerOptions` takes `client`, and `ahpw.json` carries it.
- `UPDATE: cli/serve.test.ts` - the defaults, a flag, and a config key.
- `UPDATE: cli/server.test.ts` - `ahpw.json` carries `client`.
- `UPDATE: plugin/index.ts:17-30` - `apply` reads `clientName` and `clientTitle` from its options, and `ahpw.json` carries `client`.
- `UPDATE: plugin/index.test.ts` - the plugin's defaults, and its options.
- `UPDATE: package.json:108-111` - an `optionsSchema` under `ahpd` with `clientName` and `clientTitle`.
- `UPDATE: README.md` - the two `serve` settings and the two plugin options.
- `UPDATE: CHANGELOG.md` - the settings, in task 01's line.

## Steps

1. Add `clientName` and `clientTitle` to `serveFields`, as strings, with descriptions that name the Clients list.
2. Add both to `KINDS` and to `Settings`, and default them to `ahpw` in `settingsOf`.
3. Pass `client: { name, title }` from `serve` to `createWebServer`.
4. Add `client` to `WebServerOptions`, and write it into the `ahpw.json` body.
5. Add an `optionsSchema` to `package.json`'s `ahpd` object, with `clientName` and `clientTitle` as strings.
6. Give `apply` its `options` argument, and build `ahpw.json` from them, with `ahpd-web` and `ahpd web` as defaults.
7. Add the README lines and the cases.

## Validation

- `serve.test.ts`: the defaults are `ahpw`; a flag beats the file; the file sets both.
- `server.test.ts`: `ahpw.json` carries the given `client`.
- `plugin/index.test.ts`: with no options `ahpw.json` carries `ahpd-web` and `ahpd web`; with options it carries those.
- `pnpm typecheck` and `pnpm test` pass.

## Resume

Built on 2026-11-19. The flags are `--client-name` and `--client-title`.
A blank value takes the default, in `serve` and in the plugin.
On the test daemon, `--client-title "Check page"` showed as the row's title.

