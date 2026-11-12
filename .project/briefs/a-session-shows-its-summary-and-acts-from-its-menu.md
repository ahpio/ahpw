---
title: A session shows its summary and acts from its menu
created: 2026-11-06
refs:
  - git://58c7521 - the commit of this repository the facts were checked at
  - git://60b212a - the commit that built the Summary in the session header
  - "[code://src/resources/sessions/Summary.tsx#L41](../../src/resources/sessions/Summary.tsx#L41) - `Summary`, which the header opens: KPI cards, per turn, tools, MCP servers and skills"
  - https://github.com/softov/ahpapp/blob/623fc9a44af641eaab9cf6f5d402159b2baadadb/src/components/SessionSummary.tsx#L69-L285 - ahpapp's Summary, with its timeline
---

# A session shows its summary and acts from its menu

Softov wants an open session in ahpw to show its summary and to act from its menu, after ahpapp.
The Summary is built, in [`git://60b212a`](https://github.com/ahpio/ahpw/commit/60b212a).
The menu's acts are planned in [sessions/20261112-0501-a-session-acts-from-its-menu](../plans/sessions/20261112-0501-a-session-acts-from-its-menu/plan.md).
What this brief still holds is the Summary's timeline.

## What others do

- ahpapp's Summary has a *Timeline*: one lane each for input, tools and model, one mark per step. A tap opens Raw at that step.

## What ahpw has today

- The header opens [`Summary`](../../src/resources/sessions/Summary.tsx#L41), with KPI cards, the newest turns, the tools, the MCP servers and the skills. It has no timeline.
- The Raw view draws the steps as a list.

## Who writes

- Plan [sessions/20261112-0501-a-session-acts-from-its-menu](../plans/sessions/20261112-0501-a-session-acts-from-its-menu/plan.md) changes the session page and header, not `Summary.tsx`.

## The change

- The Summary gets ahpapp's timeline: one lane each for input, tools and model, one mark per step.
- A tap on a mark opens Raw at that step.
