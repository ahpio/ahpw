---
title: ahpw says model gateway
status: done
depends: []
layer: "ahpw resources, i18n and bridges"
refs:
  - "[code://src/resources/host/sections.ts](../../../../src/resources/host/sections.ts) - the daemon sections"
  - "[code://src/resources/usage/Records.tsx](../../../../src/resources/usage/Records.tsx) - the usage icons"
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - the built-in roles"
---

## Objective

ahpw shows a `Model gateway` section for `modelGateway`, holds the built-in roles with the gateway grants, and gives a gateway's usage record its icon.

## Files

- `UPDATE: src/resources/host/sections.ts:16-19` - the section `modelGateway` with the key `modelGateway` only, and the comment over it.
- `UPDATE: src/i18n/en.json:2267` - the label `Model gateway` under the key `modelGateway`.
- `UPDATE: src/i18n/es.json:2267` - the label `Gateway de modelos` under the key `modelGateway`.
- `UPDATE: src/i18n/pt.json:2267` - the label `Gateway de modelos` under the key `modelGateway`.
- `UPDATE: src/bridges/people.ts:187` - `gateway:read` and `gateway:write` in the `member` role.
- `UPDATE: src/resources/emojis.ts:159-160` - the icon key `gateway`.
- `UPDATE: src/resources/usage/Records.tsx:12-17` - `SOURCES` keyed by plain strings, with `gateway`.
- `UPDATE: src/bridges/people-self.test.ts` - the grant `gateway:write`.
- `UPDATE: src/bridges/tokens.test.ts` - the grant `gateway:write`.
- `UPDATE: src/resources/manifest/sections.test.ts` - the section name `gateway`.

## Steps

1. Rename the section `modelProxy` to `modelGateway` in `DAEMON`, with `modelGateway` as its only key.
2. Keep `http` in the listener section, and say in the comment that `http` is the name before 0.13.
3. Rename the i18n key to `modelGateway` in the three files, with the labels the *Files* list names.
4. Rename `proxy:read` and `proxy:write` to `gateway:read` and `gateway:write` in `BUILT_IN_ROLES`.
5. Rename the icon key `proxy` to `gateway` in `EMOJIcon`.
6. Type `SOURCES` as `Readonly<Record<string, string>>`, with the keys `gateway`, `agent` and `computer`.
7. Show no icon for a source that `SOURCES` does not hold.
8. Rename the grants and the section name in the three tests.

## Validation

- A test of `Records.tsx` shows `⇄` for a record with `source: 'gateway'`, and no icon for `source: 'proxy'`.
- A test of the daemon sections puts `modelGateway` in the `modelGateway` section, and puts `modelProxy` in no section.
- `git grep -n -i "modelProxy\|model proxy\|proxy de modelos\|proxy:read\|proxy:write" -- src` finds nothing.
- `pnpm typecheck` and `pnpm test` pass.

## Resume

