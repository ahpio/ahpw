---
title: The automation form runs once or continues - implemented
date: 2026-11-21
refs:
  - "[code://src/resources/automations/Edit.tsx](../../../../src/resources/automations/Edit.tsx) - the form"
  - "[code://src/resources/automations/next.ts](../../../../src/resources/automations/next.ts) - the 1.2.0 types"
---

The form makes a one-time automation and says where each run goes, as the approved mockup draws them. The page shows a one-time automation, and the form of one that already ran is read-only.

## What was built

- [`code://src/resources/automations/next.ts`](../../../../src/resources/automations/next.ts) - `OneTimeTrigger`, `RunTarget`, `NextCapabilities`, `oneTimeOf` and `targetOf`.
- [`code://src/resources/automations/words.ts`](../../../../src/resources/automations/words.ts) - the draft fields, `localInput`, and the trigger lines.
- [`code://src/resources/automations/Edit.tsx`](../../../../src/resources/automations/Edit.tsx) - the one-time choice, the target section with its chat picker, and the read-only fieldset.
- [`code://src/resources/automations/Page.tsx`](../../../../src/resources/automations/Page.tsx) - the facts, and the form on every Settings tab.
- The strings in English, Spanish and Portuguese.

## Verified

- Each of the five states compared with the mockup in Chromium, at 1280 light and 760 dark, against a test daemon at `f96846aca`.
- The test daemon fired a one-time automation whose `runAt` had passed, and its operations became `remove` and `run`.
- The ahpw suite passes, 1060 cases. Typecheck passes.

## Departures from the plan

- The page failed for a one-time automation before this change, on ahpw main too. The fix is in this plan.
