---
title: Styles live beside their component, and components come from scena
created: 2026-11-05
refs:
  - git://65cc977 - the commit of this repository the facts were checked at
  - git://1a2fb25 - the commit that moved the connector styles beside their components, the first area of the split
  - git://d5f53cb - the commit that moved ahpw to scena 0.6.0, whose components bring no CSS
  - "[code://src/style/app.css](../../src/style/app.css) - the global file the split empties: 5,317 lines, 757 rules"
  - "[code://src/main.tsx#L4-L13](../../src/main.tsx#L4-L13) - where ahpw imports scena's style bundles and `app.css`, for every page"
  - "[code://src/resources/connectors/overview.css](../../src/resources/connectors/overview.css) - the pattern to follow: a CSS file beside the component that imports it"
  - npm://@softov/scena@^0.6.2 - the component library ahpw draws with; since 0.6.0 its styles are bundles the app imports
  - https://vite.dev/guide/features#css - Vite bundles a CSS file that a module imports, so a style loads with its component
---

# Styles live beside their component, and components come from scena

Softov wants ahpw's styles out of one global file and its pages built from scena's components.
Most of the app's styles are still in `src/style/app.css`, and many pages draw a raw element where scena has a component for it.
He called this the worst thing a web developer can do, on 2026-11-05.
The goal: each component's styles sit in a small file beside it, and a page uses a scena component wherever one exists.
A change then touches one small file.
The connectors area is done, in [`git://1a2fb25`](https://github.com/ahpio/ahpw/commit/1a2fb25); the other areas wait.

## What others do

- **scena 0.6** ships its styles as bundles by area, such as `control.css` and `data.css`, and the app imports them once, as [`code://src/main.tsx`](../../src/main.tsx#L4-L13) does.
- **Vite** bundles a CSS file that a module imports, so a component's styles load with the component and nothing else names them.
- **ahpw itself** has 27 CSS files beside their components, such as `connectors/overview.css` and `sessions/usage.css`.

## What ahpw has today

- [`code://src/style/app.css`](../../src/style/app.css) has 5,317 lines and 757 rules. 32 of its lines name scena's own `.oo-*` classes.
- The largest groups of rules left, by class prefix:

| Prefix | Lines | Rules |
|---|---|---|
| `web-bot` | 205 | 39 |
| `web-spend` | 177 | 39 |
| `web-ask` | 200 | 37 |
| `web-log` | 165 | 31 |
| `web-composer` | 192 | 30 |
| `web-explorer` | 164 | 30 |
| `web-row` | 141 | 28 |
| `web-custom` | 155 | 26 |
| `web-raw` | 140 | 26 |
| `web-tool` | 135 | 25 |

- Across 141 `.tsx` files there are 121 raw `<button>` elements and 125 scena `Button`s. There are 64 raw `<details>`, `<table>`, `<input>`, `<select>` and `<textarea>` elements.
- scena has a component for each of those elements: `Button`, `Tree` for rows that open, `DataTable`, `TextField` with `multiline`, `ChoicePicker`, `CheckBox`, `DetailList`, `List` and `Card`.

## Who writes

- No open branch of ahpw changes `app.css`.
- Plan [plugins/20261112-0221-a-record-draws-the-operations-it-offers](../plans/plugins/20261112-0221-a-record-draws-the-operations-it-offers/plan.md) may add styles for the agent and connector buttons. It puts them beside its components.
- Any feature branch cut while the split runs may add to `app.css`. Each part of the split is a small PR, so a branch rebases over one area at a time.

## The change

- Each component's styles move from `app.css` to a CSS file beside the component, which the component imports.
- A raw element that a scena component covers becomes that component, and the rules that styled the raw element go.
- A rule that overrides a scena `.oo-*` class moves beside the component that needs it, or goes when the scena component already does it.
- `app.css` keeps only what is global: the page frame, the theme tokens ahpw adds and shared helpers such as `web-note`.
- The split goes one area at a time, in the order of the table in *What ahpw has today*, each area in its own PR.
- New code adds no rule to `app.css`.

## Open points

- Some raw elements may be on purpose, such as the composer's round Send button. The plan lists each one that stays, with the reason.
- What scena lacks for ahpw's pages is not listed yet. Adding to scena is a separate decision.
