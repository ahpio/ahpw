---
title: The shells pill opens its list inside the composer
status: open
date: 2026-11-14
severity: minor
blocks: []
refs:
  - "[code://src/resources/sessions/Composer.tsx#L492](../../src/resources/sessions/Composer.tsx#L492) - the shells list, drawn inside the composer"
  - "[code://src/resources/sessions/Composer.tsx#L497-L500](../../src/resources/sessions/Composer.tsx#L497-L500) - the shells pill toggles that list; the PR and artifacts pills open a list over the composer"
  - git://c9120aa - main when the problem was read
---

## Symptom

Softov saw it on 2026-11-14 in a chat with one background shell.
A click on the shells pill opens "Shells em segundo plano" inside the composer panel.
A click on the PR pill or the artifacts pill opens a list over the composer.
The shells pill does not follow the pattern of the other pills.

## Cause

`ShellsPill` toggles `shellsOpen`, and `ShellsList` is drawn in the composer. The other pills call `openCommand`.

## Impact

The composer grows and moves when the list opens, and the pills act in two different ways.

## Workaround

none

## Fix

- Open the shells list over the composer, as the PR and artifacts lists open.
