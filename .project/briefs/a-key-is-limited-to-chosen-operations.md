---
title: A key is limited to chosen operations
created: 2026-11-11
refs:
  - git://47769e18bddd012ccdce4ea2ad521f6ec6b05ac4 - the commit of this repository the facts were checked at
  - "[code://src/resources/profile/MintForm.tsx#L105-L122](../../src/resources/profile/MintForm.tsx#L105-L122) - the grants of a new key: every grant, or a checkbox per grant as a role writes it"
  - "[code://src/resources/users/UserPage.tsx#L149](../../src/resources/users/UserPage.tsx#L149) - a user's page gives the form the person's grants as their roles write them"
  - "[code://src/resources/profile/Keys.tsx#L21](../../src/resources/profile/Keys.tsx#L21) - the profile gives the form the signed-in person's grants, read the same way"
  - "[code://src/resources/users/RoleGrants.tsx#L32-L125](../../src/resources/users/RoleGrants.tsx#L32-L125) - `SubjectCard`, a role's grants as a card per subject, with group switches and a chip per operation"
  - "[code://src/resources/users/RolePage.tsx#L38](../../src/resources/users/RolePage.tsx#L38) - the role page reads the host's grant catalog from root `_meta`"
  - "[code://src/bridges/grants.ts#L95-L150](../../src/bridges/grants.ts#L95-L150) - `operationState`, `toggleOperation` and `toggleGroup`, the grant arithmetic the cards use"
  - https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L1821-L1828 - the mint refuses a grant the person does not hold, checked with `holds`
  - https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L350-L370 - `holds`, which answers an operation from a wildcard or from its group
  - https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L1224-L1236 - a key's grant must hold at each use, on the person's side and on the key's side
  - https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L58 - `SUBJECTS`, each subject's operations and their read and write groups
  - https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token - GitHub's fine-grained token: one access level per permission, read 2026-11-11
---

# A key is limited to chosen operations

Softov wants to mint a key for some operations only, such as `chat:send`, and not only for the grants as his roles write them.
Today a person whose role grants `session:*` can give a key `session:*` or nothing of sessions.
He asked on 2026-11-11, with a key labelled `api-conversations`.

## What others do

- **GitHub's fine-grained tokens** list each permission with one access level: no access, read-only, or read and write ([docs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token)). A token gets only the permissions the person sets.
- **ahpw's own role page** edits a role's grants as one card per subject. Each card has `read`, `write` and `all` switches, and a chip per operation in three states: granted, included in a group, and not granted ([`code://src/resources/users/RoleGrants.tsx`](../../src/resources/users/RoleGrants.tsx#L32-L125)). The operations come from the host's grant catalog in root `_meta` ([`code://src/resources/users/RolePage.tsx`](../../src/resources/users/RolePage.tsx#L38)).

## What ahpw has today

- The form offers *All of their grants*, or a checkbox per grant ([`code://src/resources/profile/MintForm.tsx`](../../src/resources/profile/MintForm.tsx#L105-L122)).
- The grants are the person's grants as their roles write them, such as `session:*` and `usage:get` ([`code://src/resources/users/UserPage.tsx`](../../src/resources/users/UserPage.tsx#L149), [`code://src/resources/profile/Keys.tsx`](../../src/resources/profile/Keys.tsx#L21)).
- So a key holds a role's grant whole, or not at all. No operation inside a wildcard or a group can be picked.
- The grant arithmetic for operations and groups exists already, for the role page ([`code://src/bridges/grants.ts`](../../src/bridges/grants.ts#L95-L150)).

## What ahpd has today

- ahpd needs no change. The mint takes any grant the person holds, and checks each one with `holds` ([`users.ts`](https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L1821-L1828)).
- `holds` answers an operation from a wildcard or from its group: `session:*` holds `session:create`, and `session:write` holds it too ([`users.ts`](https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L350-L370)).
- A grant that names a group is held only by the group or a wildcard: `chat:send` does not hold `chat:write`.
- At each use, the grant must hold on the person's side and on the key's side ([`users.ts`](https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L1224-L1236)). A key with `chat:send` loses it when the person's roles lose it.
- Each subject's operations and their read and write groups are in `SUBJECTS` ([`users.ts`](https://github.com/softov/ahpd/blob/44b2d62123434b89415141904c2e81bdcde664ab/packages/sdk/src/access/users.ts#L58)), and reach ahpw through the grant catalog.

## Who writes

- ahpw has no open pull request, and every branch on the remote is merged into `main`.
- The untracked brief `an-agent-or-connector-lists-its-alerts-and-turns-off.md` in `/github/ahpw` is another session's. It touches none of the files here.

## The change

- *All of their grants* stays first, and stays the default.
- Without it, the form lists only the subjects the person's grants reach, and only the operations they hold in each.
- The person sets each subject to no access, `read`, `write`, all, or a set of operations. The key is minted with the grants that result, such as `session:read` and `chat:send`.
- A line under the form names the grants the key will hold.
- Nothing changes in ahpd.

- The layout is a card per subject, as the role page draws a role's grants, with *Add subject*. Softov chose it on 2026-11-11 over a line per subject with an access menu: "same style as the role, easy to users".
- The cards reuse `SubjectCard` and the grant arithmetic, bounded by the subjects and operations the person holds.

## Open points

- What a person sees for an operation their roles hold through `*:*`, which names every subject.
- Whether a grant from an issuer's `rolesFrom` shows. Today the hint says such grants are not listed.
