---
title: Styles live beside their component, and components come from scena
created: 2026-11-05
refs:
  - git://d1529be - the commit of this repository the facts were checked at
  - "[code://src/style/app.css](../../src/style/app.css) - every style of the app in one global file: 5,694 lines, 841 rules, 544 classes"
  - "[code://src/main.tsx#L12](../../src/main.tsx#L12) - the one place `app.css` is loaded, for every page"
  - "[code://src/resources/sessions/Start.tsx#L5](../../src/resources/sessions/Start.tsx#L5) - the pattern to follow: `start.css` beside the component that uses it"
  - npm://@softov/scena@0.5.18 - the component library ahpw draws with; each component imports its own CSS file
  - https://vite.dev/guide/features#css - Vite bundles a CSS file that a module imports, so a style loads with its component
---

# Styles live beside their component, and components come from scena

Softov wants ahpw's styles out of one global file and its pages built from scena's components.
Today every style of the app is in `src/style/app.css`, and many pages draw a raw element where scena has a component for it.
He called this the worst thing a web developer can do, on 2026-11-05.
The goal: each component's styles sit in a small file beside it, and a page uses a scena component wherever one exists.
A change then touches one small file.

## What others do

- **scena 0.5.18**, which ahpw is built on, ships each component with its own CSS file, and the component imports it. `ui/chart/Donut.js` imports `./Donut.css`, and `dist/ui` holds 56 such files.
- **Vite** bundles a CSS file that a module imports, so a component's styles load with the component and nothing else names them.
- **ahpw itself** does this in three places: `start.css` beside `Start.tsx`, `ahpio-mark.css` and `embed.css`.

## What ahpw has today

- [`code://src/style/app.css`](../../src/style/app.css) has 5,694 lines, 841 rules and 544 `.web-*` classes. [`code://src/main.tsx`](../../src/main.tsx#L12) loads it once, for every page.
- Only one of the 544 classes is named nowhere in `src/`, so the file is live code, not dead code.
- 21 of its rules override scena's own `.oo-*` classes.
- The largest groups of rules, by class prefix:

| Prefix | Lines | Rules |
|---|---|---|
| `web-connector` | 220 | 47 |
| `web-ask` | 205 | 38 |
| `web-bot` | 202 | 39 |
| `web-composer` | 192 | 30 |
| `web-spend` | 176 | 39 |
| `web-explorer` | 164 | 30 |
| `web-log` | 160 | 31 |
| `web-custom` | 159 | 27 |
| `web-raw` | 145 | 27 |
| `web-row` | 137 | 29 |

- Across 127 `.tsx` files there are 108 raw `<button>` elements and 117 scena `Button`s. There are 60 raw `<details>`, `<table>`, `<input>`, `<select>` and `<textarea>` elements.
- The raw elements, by area: `resources/sessions` 49, `shell` 23, `resources/bots` 16, `resources/automations` 14, and 7 or fewer in each other area.
- scena has a component for each of those elements: `Button`, `Tree` for rows that open, `DataTable`, `TextField` with `multiline`, `ChoicePicker`, `CheckBox`, `DetailList`, `List` and `Card`.

## Who writes

- No open branch changes `app.css`: `connectors/device-sign-in`, `explorers/copy-paths-and-settings-heading`, `sessions/usage-view` and `origin/shell/friendlier-strings` were checked.
- `sessions/usage-view` already follows the change: its Usage view uses scena's `Tree`, `DetailList`, `Progress` and `Donut`, and its layout rules are in `usage.css` beside it.
- Any feature branch cut while the split runs adds to `app.css`. Each part of the split is a small PR, so a branch rebases over one area at a time.

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
