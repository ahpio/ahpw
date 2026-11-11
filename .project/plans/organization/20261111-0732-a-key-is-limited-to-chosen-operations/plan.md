---
title: A key is limited to chosen operations
domain: organization
status: planned
priority: medium
created: 2026-11-11
revalidated: 2026-11-11
requires:
  - plans/organization/05-a-profile-and-roles-as-pills/plan.md
refs:
  - git://95a3a0e - the last commit that holds the brief `a-key-is-limited-to-chosen-operations.md`, which this plan covers
  - "[code://src/resources/profile/MintForm.tsx#L105-L122](../../../../src/resources/profile/MintForm.tsx#L105-L122) - the grants of a new key today: every grant, or a checkbox per grant as a role writes it"
  - "[code://src/resources/users/RoleGrants.tsx#L32-L120](../../../../src/resources/users/RoleGrants.tsx#L32-L120) - `SubjectCard`, the card per subject that the key's grants reuse"
  - "[code://src/resources/users/RoleGrants.tsx#L127-L133](../../../../src/resources/users/RoleGrants.tsx#L127-L133) - `RoleGrants`, its subjects and what *Add subject* offers"
  - "[code://src/bridges/grants.ts#L95-L150](../../../../src/bridges/grants.ts#L95-L150) - `operationState`, `toggleOperation` and `toggleGroup`, the grant arithmetic the cards use"
  - "[code://src/resources/users/RolePage.tsx#L37-L38](../../../../src/resources/users/RolePage.tsx#L37-L38) - the role page reads the host's grant catalog from root `_meta`"
  - "[code://src/resources/users/UserPage.tsx#L149](../../../../src/resources/users/UserPage.tsx#L149) - a user's page gives the form the person's grants"
  - "[code://src/resources/profile/Keys.tsx#L21](../../../../src/resources/profile/Keys.tsx#L21) - the profile gives the form the signed-in person's grants"
  - https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L350-L370 - ahpd's `holds`, which `heldBy` mirrors
  - https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L1821-L1828 - the mint refuses a grant the person does not hold
---

## Goal

A person mints a key for the operations they choose, such as `session:read` and `chat:send`, and not only for their role grants as written.
Without *All of their grants*, the form shows the subjects as cards, in the same style as a role's grants on the role page.
The cards offer only what the person holds, so the host never refuses a grant the form offered.
ahpd needs no change.

## Reconnaissance

The files read and the patterns to reuse are the `refs` above, each with its note.

### Searches performed

- `git grep "holds\b" origin/main -- packages/sdk/src/access/users.ts` in ahpd - the mint and every use check a grant with `holds`.
- `rg "operationState|toggleOperation" src` - only `RoleGrants.tsx` uses the grant arithmetic today.
- `rg "MintForm" src` - the profile's Keys and a user's page use the one form.

### Runtime path

```
Keys or UserPage -> MintForm (host, user?, grants = the person's role grants)
  -> unticked "All of their grants" -> KeyGrants (catalog from root _meta, bound = the person's grants)
     -> + Add subject: subjects the bound reaches -> SubjectCard: operations the bound holds
     -> picked grants -> summary line -> x-ahpd/tokens/mint { grants }
```

### Gaps

- ahpw has no function that answers whether a set of grants holds one grant, as ahpd's `holds` does.
- `operationState` does not know that `session:<group>` holds `chat:<group>`.
- `SubjectCard` and `RoleGrants` show every operation of the catalog, with no bound.
- `MintForm` reads no catalog.

## Answers

| What | Source | Task |
| --- | --- | --- |
| The key's grants are cards per subject, in the role page's style, with *Add subject*. | Softov, 2026-11-11: "the A is better than the B. same style as the role. easy to users." | 02 |
| A person with `*:*` is offered every subject of the catalog, each with all its operations. | Softov, 2026-11-11: "Every subject" | 01 |
| *All of their grants* stays first and is the default. | (defaulted: a key that follows the person's roles is what the form makes today) | 02 |
| The cards start empty; *Add subject* adds one, as in the mockup. | (defaulted: the mockup Softov chose) | 02 |
| An operation, a group switch or a subject that the person does not hold is not offered. | (defaulted: the host refuses it at the mint) | 01 |
| Grants from `rolesFrom` stay out, and the hint still says so. | [plan 05](../05-a-profile-and-roles-as-pills/plan.md), 2026-10-20: "Roles added by rolesFrom at sign-in are not in that list" | - |
| A line under the cards names the grants the key will hold. | (defaulted: the mockup Softov chose) | 02 |

## Proposed architecture

- **Data flow** - `MintForm` reads the root through `useChannel(host, ROOT, rootReducer)` and the catalog with `grantCatalog`, as the role page does. The person's grants are the bound.
- **Event flow** - A chip or a switch changes the picked grants in the form's state. The mint sends them as `grants`.
- **State flow** - The picked grants and the shown subjects live in `MintForm`, and go on *Cancel* or after a mint.
- **Layer responsibilities** - `src/bridges/grants.ts`: `heldBy` and the bounded subject list. `src/resources/users/RoleGrants.tsx`: an optional `bound` on `RoleGrants` and `SubjectCard`. `src/resources/profile/MintForm.tsx`: the cards in place of the checkboxes.
- **Source-of-truth files** - [`code://src/bridges/grants.ts`](../../../../src/bridges/grants.ts) for the grant rules; ahpd's `holds` for what the host accepts.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The grant cards take a bound](task-01-the-grant-cards-take-a-bound.md) | todo | - |
| [02 - A new key picks its grants on cards](task-02-a-new-key-picks-grants-on-cards.md) | todo | 01 |

## Risks and tradeoffs

- `heldBy` copies ahpd's rule, and a change to `holds` in ahpd must reach it - its doc names `holds`, and its tests copy ahpd's cases.
- The role page shares the cards - `bound` is optional, and without it the role page draws as today.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-grant-cards-take-a-bound.md](task-01-the-grant-cards-take-a-bound.md).
- **Open questions:** none.
- **Watch out for:** a split of an implied operation must stay inside the bound. Splitting `session:*` gives back only groups and operations the person holds.

## Final verification checklist

- [ ] With `session:*`, a key can be minted with `session:read` alone, and the host accepts it.
- [ ] With `*:*`, *Add subject* lists every subject of the catalog.
- [ ] An operation the person does not hold shows on no card.
- [ ] The role page draws and edits as before.
- [ ] The form shows at 1400 and 390 px.
