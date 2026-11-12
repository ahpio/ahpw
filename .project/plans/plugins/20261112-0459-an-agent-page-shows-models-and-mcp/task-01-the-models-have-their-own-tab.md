---
title: The models have their own tab
status: implemented
depends: []
layer: "ahpw agents"
refs:
  - "[code://src/resources/agents/Page.tsx#L79-L95](../../../../src/resources/agents/Page.tsx#L79-L95) - the tab list the Models tab joins"
  - "[code://src/resources/agents/Overview.tsx#L34-L130](../../../../src/resources/agents/Overview.tsx#L34-L130) - the facts, the models table and the Customizations line"
  - "[code://src/resources/connectors/Models.tsx#L18-L80](../../../../src/resources/connectors/Models.tsx#L18-L80) - the search and table to mirror"
---

## Objective

The agent page has a *Models N* tab after Overview, with a search over the models table.
The Overview has no models table, no Models fact and no Customizations line, and names the kinds the agent has none of in its grid.

## Files

- `CREATE: src/resources/agents/Models.tsx` - the Models tab: a search, the count, and the models table that `Served` draws today.
- `CREATE: src/resources/agents/models.ts` - `matchesModel(model, query)`, a match on the name or the id, ignoring case.
- `CREATE: src/resources/agents/models.test.ts` - the match on a name, on an id, on case, and on nothing.
- `CREATE: src/resources/agents/models.css` - the search row's layout, beside the tab.
- `UPDATE: src/resources/agents/Page.tsx:79-95` - the Models tab after Overview, when the host serves the agent.
- `UPDATE: src/resources/agents/Overview.tsx:34-130` - remove the Models fact, the models table and the Customizations line; add the Customizations fact.
- `UPDATE: src/i18n/en.json` - the tab title, the search placeholder and the count.
- `UPDATE: src/i18n/es.json` - the same.
- `UPDATE: src/i18n/pt.json` - the same.

## Steps

1. Move the models table from `Served` to `Models.tsx`, with its columns and policy words unchanged.
2. Add a `TextField` search above the table and the count beside it, as the connector's Models tab has.
3. Keep the rows that `matchesModel` accepts.
4. Show *No model matches.* when the search leaves no row.
5. Add the tab after Overview in `Page.tsx` when the root lists the agent.
6. Give the tab the model count in its title, such as *Models 13*.
7. Show the agent's note that it lists no models when the list is empty, as `Served` does today.
8. Remove the Models fact from the Overview grid.
9. Remove the Customizations section from `Served`.
10. Add a *Customizations* fact to the grid when `emptyKinds` is not empty, with the existing *None: {kinds}* words.
11. Keep the sign-in table on the Overview.

## Validation

- `src/resources/agents/models.test.ts` passes.
- `pnpm typecheck` and `pnpm test` pass.
- By hand: the Models tab searches, and the Overview shows the Customizations fact only when kinds are missing.
- By hand: the page at 1400 and 390 px.

## Resume
