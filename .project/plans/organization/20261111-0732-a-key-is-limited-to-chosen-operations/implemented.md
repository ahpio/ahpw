---
title: A key is limited to chosen operations - implemented
date: 2026-11-11
refs:
  - git://6433311 - the merge of ahpio/ahpw#61
  - "[code://src/bridges/grants.ts](../../../../src/bridges/grants.ts)"
  - "[code://src/resources/users/RoleGrants.tsx](../../../../src/resources/users/RoleGrants.tsx)"
  - "[code://src/resources/profile/MintForm.tsx](../../../../src/resources/profile/MintForm.tsx)"
---

On *New key*, a person who unticks *All of their grants* picks the grants on cards. The cards look as a role's grants do on the role page. The cards offer only the subjects, groups and operations the person holds, so a key can hold `session:read` or `chat:send` alone. A line under the cards names the grants the key will hold.

## What was built

- [`code://src/bridges/grants.ts`](../../../../src/bridges/grants.ts) - `heldBy`, ahpd's `holds` rule; `boundSubjects`, the subjects a bound holds an operation of; `boundInfo`, a subject with only the operations a bound holds.
- [`code://src/resources/users/RoleGrants.tsx`](../../../../src/resources/users/RoleGrants.tsx) - an optional `bound`, which limits the cards, the group switches, a split and *Add subject*; `emptyNote` and `addHint`.
- [`code://src/resources/users/role-grants.css`](../../../../src/resources/users/role-grants.css) - *Add subject* with its note beside it.
- [`code://src/resources/profile/MintForm.tsx`](../../../../src/resources/profile/MintForm.tsx) - the cards in place of the checkboxes, the catalog read from the root, and the summary line.
- `src/i18n/en.json`, `es.json` and `pt.json` - the empty note, the add hint and the summary line.

## Verified

- `pnpm typecheck` passed, and `pnpm test` passed 828 tests.
- `src/bridges/grants.test.ts` covers `heldBy` with each case of the task, `boundSubjects` and `boundInfo`.
- On a test daemon, soft has `developer`: `session:read` and `session:write`. *Add subject* offered `session` and `chat` only, and the `all` switch was disabled. A key with `session:read` alone was minted, and its row shows `session:read`.
- uclau has `admin`, which holds `*:*`. *Add subject* offered every subject of the catalog, and a key with `chat:send` and `chat:cancel` was picked.
- The role page drew `developer` as before, and *Add subject* there offered every other subject.
- The form showed at 1400 and 390 px.

## Departures from the plan

- `boundSubjects` offers a subject when the bound holds one of its operations, not only a subject the bound names. So `session:read` offers `chat`, as ahpd's `holds` does.
- The note beside *Add subject* comes from the chosen mockup. The task steps did not name it.
- The unused `.web-mint__grants` rule is removed from `app.css`.

## Left for later

- A card does not show a chat operation as held when the picked grants hold the session's group. `operationState` still does not know that `session:<group>` holds `chat:<group>`.
