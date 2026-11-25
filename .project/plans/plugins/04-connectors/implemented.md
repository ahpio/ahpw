---
title: Connectors in an explorer, a form and a page - implemented
date: 2026-10-23
refs:
  - git://f68b6c0
  - "[code://src/resources/connectors/Explorer.tsx](../../../../src/resources/connectors/Explorer.tsx)"
---

A person lists, makes, changes and deletes a host's connectors, and sees the URL that a webhook receives at.

## What was built

- [`code://src/bridges/connectors.ts`](../../../../src/bridges/connectors.ts) - the adapters, the connectors and their commands.
- [`code://src/resources/connectors/Explorer.tsx`](../../../../src/resources/connectors/Explorer.tsx) - the 🔌 explorer.
- [`code://src/resources/connectors/ConnectorForm.tsx`](../../../../src/resources/connectors/ConnectorForm.tsx) - the form.
- [`code://src/resources/connectors/ConnectorPage.tsx`](../../../../src/resources/connectors/ConnectorPage.tsx) - the page.

## Verified

- The plan's *Final verification checklist* is ticked, on ahpd main at port 9199.

## Departures from the plan

- Task 06 moved ahpw from connector kinds to ahpd's adapters and connector grants.
- Task 07 is dropped here, as [deferred.md](deferred.md) says.
