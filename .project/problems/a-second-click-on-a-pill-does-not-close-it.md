---
title: A second click on a pill does not close what it opened
status: open
date: 2026-11-14
severity: minor
blocks: []
refs:
  - "[code://src/resources/sessions/pills.tsx#L13-L35](../../src/resources/sessions/pills.tsx#L13-L35) - `Pill`, which calls `onOpen` on each click"
  - "[code://src/resources/sessions/Composer.tsx#L498-L500](../../src/resources/sessions/Composer.tsx#L498-L500) - the PR and artifacts pills, which open a list with `openCommand`"
  - git://c9120aa - main when the problem was read
---

## Symptom

Softov saw it on 2026-11-14 on the PR pill and the artifacts pill of a chat.
A click on a pill opens its list. A second click on the same pill does not close the list.

## Cause

Unknown. `Pill` calls `onOpen` on each click, and `openCommand` opens the list again rather than closing it.

## Impact

A person expects the pill to toggle its list, and has to press Escape or click elsewhere.

## Workaround

Press Escape, or click outside the list.

## Fix

- A click on the pill that opened the list closes it.
