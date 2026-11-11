---
title: A new key picks its grants on cards
status: todo
depends: [task-01-the-grant-cards-take-a-bound.md]
layer: "ahpw profile"
refs:
  - "[code://src/resources/profile/MintForm.tsx#L105-L122](../../../../src/resources/profile/MintForm.tsx#L105-L122) - the checkboxes the cards replace"
  - "[code://src/resources/users/RolePage.tsx#L37-L38](../../../../src/resources/users/RolePage.tsx#L37-L38) - the catalog read this form copies"
---

## Objective

Without *All of their grants*, the key form shows the bounded cards with *Add subject*, and a line naming the grants the key will hold.
The mint sends those grants.

## Files

- `UPDATE: src/resources/profile/MintForm.tsx:105-122` - the cards in place of the checkbox list, the catalog read, the summary line.
- `UPDATE: src/i18n/en.json` - the summary line's words.
- `UPDATE: src/i18n/es.json` - the same key.
- `UPDATE: src/i18n/pt.json` - the same key.

## Steps

1. Read the root in `MintForm` with `useChannel(host, ROOT, rootReducer)`, and the catalog with `grantCatalog`.
2. Replace the checkbox list with `RoleGrants`. Give it the picked grants, the catalog, the shown subjects and the person's grants as `bound`.
3. Keep *All of their grants* first and ticked by default; the cards show only when it is not ticked.
4. Under the cards, show a line with the picked grants, or a note that the key has no grant yet.
5. Keep *Create key* disabled while the key has no grant, as today.
6. Clear the picked grants and the shown subjects on *Cancel* and after a mint.
7. Add the summary line's key to `en.json`, `es.json` and `pt.json`.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand, on a test daemon: with `session:*`, mint a key with `session:read` alone. The host accepts it, and its row shows `session:read`.
- By hand: with `*:*`, *Add subject* lists every subject.
- By hand: the form shows at 1400 and 390 px, and matches the chosen mockup.

## Resume

