---
title: The bot form edits every field
created: 2026-11-13
refs:
  - git://8d16b19 - the commit of ahpw the facts were checked at
  - git://b461d4f75 - the commit of ahpd main the facts were checked at
  - "[code://src/resources/bots/Edit.tsx](../../src/resources/bots/Edit.tsx) - the bot form"
  - "[code://src/resources/bots/catalogue.ts#L17-L39](../../src/resources/bots/catalogue.ts#L17-L39) - `BotRecord`, which says `harness` and has no `connectors`"
  - "[code://src/resources/computers/New.tsx](../../src/resources/computers/New.tsx) - a form drawn from a scheme's manifest, in fields, json and yaml"
  - "[code://src/resources/computers/manifest.ts](../../src/resources/computers/manifest.ts) - `formSchema`, which reads `x-choices` as `x-enumOptions`"
  - https://github.com/ahpio/ahpd/blob/b461d4f75/packages/bot/src/provider.ts - `manifest`, the bot record's schema, sent by `describe()`
---

# The bot form edits every field

Softov wants the bot form to edit more of a bot, for advanced use. Today a person edits 7 of the 14 fields a bot record takes. The other fields need a hand edit of `bot.md` on the host.

## What ahpw has today

- The form edits the name, labels, description, instructions, body, colour and owner, and picks the host on a new bot.
- `BotRecord` names `harness`, where ahpd names `provider`. It has no `connectors`, and no `unavailable`.
- The computer form draws its settings from the scheme's manifest, through `offers.providers[...].manifest`, `formSchema` and `SchemaForm`, in fields, json and yaml.

## What ahpd sends

- The bot scheme's `describe()` sends `manifest`. It is a JSON Schema of every field a write takes.
- ahpw has it as `offers.providers.bot.manifest`, and the bot form does not read it.
- The fields with no control in ahpw are `provider`, `model`, `preset`, `template`, `session`, `workspace`, `computer` and `connectors`. Each has a description in the manifest.
- `provider`, `model`, `preset`, `template` and `computer` are plain strings, with no `x-choices`. A form drawn from the manifest shows each as free text.
- `workspace` never moves after a make. The manifest says so in its description only.
- A read answers `unavailable` when the bot names an agent the host does not serve. ahpw does not show it.

## The change

- The bot form keeps its look, name, owner, labels, description and instructions.
- Under them, an Advanced section draws the manifest's other fields with `SchemaForm`, in fields, json and yaml, as the computer form does.
- A save sends those fields with the rest.
- `BotRecord` follows ahpd: `provider`, `connectors` and `unavailable`.
- The bot page says when a bot is unavailable.

## Open questions

- Is the Advanced section closed until a person opens it, or a tab of the form? A mockup comes first.
- Do `provider`, `model`, `preset`, `template` and `computer` stay free text, or does ahpd's bot manifest name their choices in `x-choices`? Choices are an ahpd change.
- Does an edit show `workspace` read only, or leave it out? The manifest does not mark it.
