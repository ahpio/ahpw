---
title: Plugin facts sit before the README
status: doing
depends: []
layer: "resources/plugins"
refs:
  - "[code://src/resources/plugins/ListTabs.tsx#L39-L100](../../../../src/resources/plugins/ListTabs.tsx#L39-L100) - `FactsColumn` and `PageBody`"
  - "[code://src/resources/plugins/ListTabs.tsx#L140-L189](../../../../src/resources/plugins/ListTabs.tsx#L140-L189) - `listTabs`, which puts the column beside each listed tab"
  - "[code://src/resources/plugins/PluginPage.tsx#L102-L165](../../../../src/resources/plugins/PluginPage.tsx#L102-L165) - the installed page's column and tabs"
  - "[code://src/resources/plugins/Overview.tsx#L34-L47](../../../../src/resources/plugins/Overview.tsx#L34-L47) - the installed *Overview*: problem, view, alerts, README"
  - "[code://src/resources/plugins/ListTabs.css](../../../../src/resources/plugins/ListTabs.css) - the grid of the panel and the column"
---

## Objective

A plugin page, installed or listed, has no column beside its tabs.
*Overview* starts with one facts section, *Installation*, *Marketplace*, *Categories* and *Resources*, and the README follows it at full width.
*Features* and *Changelog* take the full width with no facts.

## Files

- `UPDATE: src/resources/plugins/ListTabs.tsx:39-100` - `FactsColumn` becomes `PluginFacts`, a section drawn in the page flow; `PageBody` goes.
- `UPDATE: src/resources/plugins/ListTabs.tsx:140-189` - `listTabs` puts `PluginFacts` at the top of *Overview* only.
- `UPDATE: src/resources/plugins/PluginPage.tsx:102-165` - the installed *Overview* gets `PluginFacts` first; the other tabs lose `PageBody`.
- `UPDATE: src/resources/plugins/ListTabs.css` - remove the two-column grid and its container query; style the facts section.

## Steps

1. Rename `FactsColumn` to `PluginFacts`, and draw it as a `section` in place of an `aside`.
2. Lay out its sections in a row that wraps, side by side on a wide page.
3. Draw each facts section's `DetailList` with two columns, so *Running* and *Path* share a line.
4. Remove `PageBody` and its classes `web-listed__body` and `web-listed__main`.
5. In `listTabs`, put `PluginFacts` first in *Overview*, before `Problems` and the README.
6. In `PluginPage`, pass `PluginFacts` to the installed *Overview*, first, before the problem and the README.
7. Draw *Features* and *Changelog* with no facts and no wrapper.
8. Remove the grid and the `@container listed-page` rule from `ListTabs.css`, and keep the facts styles beside their component.

## Validation

- `pnpm typecheck` and `pnpm test` pass.
- By hand: the installed Agent Claude page shows the facts above the README, as Softov picked.
- By hand: a listed plugin page shows the same layout.
- By hand: check both pages at 1280 px and 760 px, light and dark.
- By hand: *Features* and *Changelog* show no facts and use the full width.

## Resume

Built on 2026-11-19 and waiting for review.
`PageBody` became `TabBody`, which keeps `web-listed__main` with no column, because a tab panel does not space its parts.
The facts section has a line under it before the README.
The visual check at two widths is in [the pending checks](../../../pending/agent-and-plugin-pages-checks.md).
