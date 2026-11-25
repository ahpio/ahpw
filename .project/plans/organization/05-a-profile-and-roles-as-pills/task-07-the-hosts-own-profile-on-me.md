---
title: The host's own connection has a profile, and Info reads x-ahpd/me
status: done
depends: [task-05-keys-mints-a-token.md]
layer: "ahpw profile"
refs:
  - "[code://src/bridges/people.ts](../../../../src/bridges/people.ts) - `selfId` and `readOwnUser`, which `me` replaces"
  - "[code://src/shell/manage.ts](../../../../src/shell/manage.ts) - `accountGroup`, whose `when` is a person today"
  - "[code://src/resources/profile/Info.tsx](../../../../src/resources/profile/Info.tsx) - the Info tab"
---

## Objective

A `root:<host>` connection has a profile and a Manage entry, as a person does.
Info reads `x-ahpd/me` for both, so the roles a sign-in adds through `rolesFrom` show.
Root's Keys picks a person, then lists, mints and revokes that person's tokens.

## Files

- `CREATE: src/bridges/me.ts` - `readMe`, `trackMe`, `profileOf` and `grantsHeld`, on the `Me` type of `@ahpd/sdk`.
- `CREATE: src/bridges/me.test.ts` - a person, root, a refusal, and the entries that follow a grant.
- `UPDATE: src/bridges/own-grants.ts` - reads the kept `me`, not `user://<id>`.
- `UPDATE: src/bridges/grants.ts` - `expandGrants`, so a group grant holds each of its operations.
- `UPDATE: src/bridges/offers.ts` - each channel's grant, and the catalog of grants.
- `UPDATE: src/bridges/served.ts` - `mayOpen`, which `trackServed` asks when it is given a second grant list.
- `UPDATE: src/bridges/data.ts` - the path each host's `me` is kept at.
- `UPDATE: src/resources/connectors/index.ts` - the 🔌 entry follows `connector:list` or `connector:all`.
- `UPDATE: src/resources/plugins/index.ts` - the 🔣 entry follows `plugin:list`.
- `UPDATE: src/resources/clients/index.ts` - the entry follows `client:read`.
- `UPDATE: src/resources/tunnels/index.ts` - the entry follows `tunnel:read`.
- `UPDATE: src/resources/teams/index.ts` - the entry follows `team:read`.
- `UPDATE: src/resources/policies/index.ts` - the entry follows `policy:read`.
- `UPDATE: src/resources/computers/index.ts` - the entry follows `computer:read`.
- `UPDATE: src/resources/connectors/form.ts` - owner choices take grants and memberships, not a record.
- `UPDATE: src/resources/connectors/ConnectorForm.tsx` - reads the kept `me`.
- `UPDATE: src/resources/agents/AgentForm.tsx` - reads the kept `me`.
- `UPDATE: src/shell/manage.ts` - an entry for a person and one for the host itself.
- `UPDATE: src/shell/register-shell.tsx` - registers `trackMe`.
- `UPDATE: src/resources/profile/ProfilePage.tsx` - a header for root.
- `UPDATE: src/resources/profile/Info.tsx` - reads `me`.
- `UPDATE: src/resources/profile/Keys.tsx` - for root, a person picker over the list and the form.
- `UPDATE: src/resources/users/UserPage.tsx` - edit controls follow the reader's grants.
- `UPDATE: src/i18n/en.json` - the root words.
- `UPDATE: src/i18n/es.json` - the same keys.
- `UPDATE: src/i18n/pt.json` - the same keys.

## Steps

1. Keep each host's `me` in the store, asked at each handshake.
2. Move `own-grants` and the two owner forms onto the kept `me`.
3. Move Info onto `readMe`, and mark each role in `rolesFromSignIn`.
4. Show the profile entry and the page for `root:<host>`, with the host's icon.
5. For root, show the grants, and usage from the pools `me` names.
6. For root's Keys, list the people, then show the keys of the one picked.
7. Draw the user page's edit, delete and keys controls only for a reader with the grants.
8. Keep each channel's `grant` and the catalog from the handshake in `Offers`.
9. Show 🔌, 🔣, Clients, Tunnels, Teams, Policies and Computers only while the reader holds the channel's grant, or `connector:all` for 🔌.

## Validation

- `src/bridges/me.test.ts` passes.
- `npx tsc -b` and `npx vitest run` pass.
- By hand on a root connection: the Manage entry, Info, and minting a token for a person.
- By hand as a person with a `rolesFrom` role: the role shows, marked as from sign-in.
- By hand: a reader without `connector:list` or `plugin:list` sees no 🔌 or 🔣 entry.
- By hand, light and dark.

## Resume

