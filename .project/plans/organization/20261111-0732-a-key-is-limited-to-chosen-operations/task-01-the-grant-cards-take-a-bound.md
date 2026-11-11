---
title: The grant cards take a bound
status: todo
depends: []
layer: "ahpw bridges and users"
refs:
  - "[code://src/bridges/grants.ts#L95-L150](../../../../src/bridges/grants.ts#L95-L150) - the grant arithmetic that gains `heldBy`"
  - "[code://src/resources/users/RoleGrants.tsx#L32-L133](../../../../src/resources/users/RoleGrants.tsx#L32-L133) - `SubjectCard` and `RoleGrants`, which gain an optional `bound`"
  - https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L350-L370 - ahpd's `holds`, the rule `heldBy` copies
---

## Objective

`heldBy` answers whether a set of grants holds one grant, by ahpd's rule.
`RoleGrants` takes an optional `bound` and offers only the subjects, groups and operations that the bound holds.

## Files

- `UPDATE: src/bridges/grants.ts` - add `heldBy(bound, grant, catalog)` and `boundSubjects(bound, catalog)`.
- `UPDATE: src/bridges/grants.test.ts` - cases for `heldBy` and `boundSubjects`.
- `UPDATE: src/resources/users/RoleGrants.tsx:32-133` - an optional `bound` on `RoleGrants` and `SubjectCard`.

## Steps

1. Add `heldBy` to `grants.ts` with the rule of ahpd's `holds`: the grant, `*:*`, a wildcard, or the operation's group.
2. Make `heldBy` answer `chat:<group>` from `session:<group>`, as `holds` does.
3. Make `heldBy` answer a group grant only from that group or a wildcard, never from its operations one by one.
4. Add `boundSubjects`: every catalog subject when the bound holds `*:*`, else the subjects the bound names, in catalog order.
5. Give `RoleGrants` an optional `bound`. With it, *Add subject* offers `boundSubjects` only.
6. Give `SubjectCard` the bound. With it, show only the operations `heldBy` answers, and drop a row with none.
7. With a bound, disable a group switch whose grant the bound does not hold.
8. With a bound, keep `toggleOperation`'s split inside the bound: drop each grant it returns that the bound does not hold.
9. Leave every path without `bound` as it is today.

## Validation

- `src/bridges/grants.test.ts`: `heldBy` with `session:*`, `session:write`, `*:read`, `*:*`, `chat:send` against `chat:write`, and `session:read` against `chat:turns`.
- `src/bridges/grants.test.ts`: `boundSubjects` with `*:*` lists the catalog; with `session:*` and `usage:get` lists those two.
- `pnpm typecheck` and `pnpm test` pass.
- By hand, the role page draws and edits a role as before.

## Resume

