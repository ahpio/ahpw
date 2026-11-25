---
title: The signed-in person's profile and role pills - implemented
date: 2026-11-24
refs:
  - "[code://src/bridges/me.ts](../../../../src/bridges/me.ts)"
  - "[code://src/resources/profile/Keys.tsx](../../../../src/resources/profile/Keys.tsx)"
---

A person, and the host itself, has a profile with Info and Keys, and a user's roles are pills.

## What was built

- Tasks 01 to 06 are in main since 2026-10-21.
- [`code://src/bridges/me.ts`](../../../../src/bridges/me.ts) - who a connection is, kept per host and asked at each handshake.
- [`code://src/resources/profile/Info.tsx`](../../../../src/resources/profile/Info.tsx) - Info for a person and for the host.
- [`code://src/resources/profile/Keys.tsx`](../../../../src/resources/profile/Keys.tsx) - the host's Keys picks a person.

## Verified

- `npx tsc -b`, `npx vitest run` and `npm run build` pass.
- Task 07 on an isolated ahpd 0.15.0, in Chromium, light and dark, at 1300 and 820 pixels.
- It ran as root, as an admin and as two people with narrow roles.
- Root: the Manage entry, Info, and a key minted for a person and revoked.
- A reader without `connector:list` and `plugin:list` sees no 🔌 and no 🔣. A reader with `*:read` sees both.
- A reader without `client:read`, `tunnel:read`, `team:read`, `policy:read` or `computer:read` sees no entry for that list.
- A reader without `user:put` sees no Save and no Delete. They still see their own Keys.
- Not checked live: a role added by a sign-in. It needs an issuer.

## Departures from the plan

- `readOwnUser` stays, for Keys alone.
- A connection made with a key sees a note in Keys in place of the host's refusal, because a host lets no key manage keys.
- A host that does not serve `x-ahpd/me` shows no profile. ahpd serves it since 0.15.
- The user page says that the reader has no permission, not that the host takes no changes.
