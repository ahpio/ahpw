---
title: The automation form hides a model its agent does not offer
status: open
date: 2026-11-14
severity: minor
blocks: []
refs:
  - "[code://src/resources/automations/Edit.tsx#L205-L210](../../src/resources/automations/Edit.tsx#L205-L210) - the model select, which lists only the agent's models"
  - "[code://src/resources/automations/Page.tsx#L50](../../src/resources/automations/Page.tsx#L50) - the automation page, which shows the saved model as it is"
  - git://ddec5cc - main when the problem was read
---

## Symptom

Softov saw it on 2026-11-14 on the automation "Test automation".
The automation saves the model `opus[1m]`, and its page shows `opus[1m]`.
Claude now offers `opus`, not `opus[1m]`. The edit form shows "Agent default" in the model select.
A run of the automation fails with "Its agent claude does not offer the turn's model opus[1m]".

## Cause

The select has an option for each model the agent offers, and one for the agent's default.
A saved model that is not in that list has no option, so the browser shows the first option.
The draft still holds `opus[1m]`, so a save keeps the model that the form does not show.

## Impact

A person reads "Agent default" and expects the agent's default model.
The runs fail on a model that the form does not show, and the form gives no hint of the cause.

## Workaround

Pick a model in the select and save. The automation file in `~/.config/ahpd/automations/` holds the model too.

## Fix

- The select adds an option for a saved model that the agent does not offer, marked as not offered.
- The form says under the select that the agent does not offer the saved model.
