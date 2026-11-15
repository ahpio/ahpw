---
title: A person finds a plugin to install
domain: plugins
status: planned
priority: medium
created: 2026-11-15
revalidated: 2026-11-15
requires: []
changes: []
creates: []
refs:
  - git://75d684c7baf32f80db5c30714048247009a83e8d - the commit of ahpw this plan was checked at
  - https://github.com/ahpio/ahpd/blob/main/.project/plans/plugin/20261113-2029-the-daemon-reads-the-plugin-list/plan.md - the ahpd plan that serves the lists, on branch `plugin/20261113-2029-the-daemon-reads-the-plugin-list`
  - "[code://src/resources/plugins/Explorer.tsx#L31-L108](../../../../src/resources/plugins/Explorer.tsx#L31-L108) - the Plugins sidebar, which gets the listed rows"
  - "[code://src/shell/explorer/ExplorerList.tsx#L52-L72](../../../../src/shell/explorer/ExplorerList.tsx#L52-L72) - `ExplorerList`, whose filter is its own state"
  - "[code://src/shell/explorer/ExplorerList.tsx#L15-L39](../../../../src/shell/explorer/ExplorerList.tsx#L15-L39) - `Row`, whose `action` is an icon button"
  - "[code://src/resources/plugins/rows.ts#L65-L100](../../../../src/resources/plugins/rows.ts#L65-L100) - `pluginRows`, the shape of a row the listed rows copy"
  - "[code://src/resources/plugins/PluginPage.tsx#L51-L112](../../../../src/resources/plugins/PluginPage.tsx#L51-L112) - an installed plugin's page, which gets the list tabs"
  - "[code://src/resources/plugins/Overview.tsx#L60-L79](../../../../src/resources/plugins/Overview.tsx#L60-L79) - *Provides*, which Features reuses"
  - "[code://src/resources/plugins/index.ts#L40-L53](../../../../src/resources/plugins/index.ts#L40-L53) - `open`, the command the listed page's command copies"
  - "[code://src/bridges/plugins.ts#L167-L178](../../../../src/bridges/plugins.ts#L167-L178) - `change` and `installPlugin`"
  - "[code://src/resources/plugins/actions.ts](../../../../src/resources/plugins/actions.ts) - `rereadAfterChange` and the offer checks"
  - https://github.com/microsoft/vscode/blob/1564f100807a/src/vs/workbench/contrib/chat/common/plugins/pluginMarketplaceService.ts#L679 - VS Code lists the plugins of every marketplace, each with its marketplace
---

## Goal

A person finds a plugin in ahpw without knowing its name first, and installs it from there, as in the VS Code Extensions view.
The host answers the plugins its lists hold with `x-ahpd/plugins/available`, and one plugin's files with `x-ahpd/plugins/details`.
The mockups are `.scratch/mockups/plugin-list/mock-<width>-<theme>-<tab>[-filter-<word>][-page].png`, which Softov accepted on 2026-11-15.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `rg -n "plugins/available|plugins/details" src` - no match. ahpw calls neither.
- `rg -n "searchRows|filter" src/shell/explorer/ExplorerList.tsx` - the filter is the list's own state, and filters `rows` only.
- `rg -n "action\b" src/shell/explorer/ExplorerList.tsx` - a row's action is an icon button.

### Runtime path

```
Plugins sidebar: no search -> the installed rows, as today
                 a search  -> one flat list: the installed rows that match, then the listed rows that match and are not installed
x-ahpd/plugins/available (each host that offers it, on mount and after a change) -> listed rows, each with Install
listed row -> ahp.openListedPlugin { host, id, marketplace } -> ListedPluginPage -> x-ahpd/plugins/details
  Install -> x-ahpd/plugins/install { source, marketplace } -> rereadAfterChange -> ahp.openPlugin { host, id }
installed row -> PluginPage -> its list entry, when one has installed.id = its id -> Details, Features, Changelog and the facts column
```

### Gaps

- The bridge has no call for `available` or `details`, and `installPlugin` sends no `marketplace`.
- `ExplorerList` has no rows that show only while a search is typed, and no text button on a row.
- No page shows a plugin that is not installed.
- ahpd's `installed` names no row id, so ahpw cannot tell which row an entry is. The ahpd branch gets `installed.id`.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw lists the plugins a host can install | Softov, 2026-11-15: "We will need onto ahpw the list of the plugins right?" | 02 |
| The list lives in the Plugins sidebar | Softov, 2026-11-15: "A section in the Plugins sidebar" | 02 |
| One list: the installed plugins with no search, every match with a search, as VS Code | Softov, 2026-11-15: "on vscode, it more like merge and are one list" | 02 |
| A plugin can update by itself, with a check on its page | Softov, 2026-11-15: "a plugin could have a autoupdate" | deferred |
| An installed plugin in a list has the same page as one that is not installed | Softov, 2026-11-15: "One page, as VS Code" | 04 |
| The mockups are accepted | Softov, 2026-11-15: "mockups are acceptable" | 02, 03, 04 |
| While a search is typed, the list is flat, with no group headings | (defaulted: as the mockup, and as VS Code's search) | 02 |
| The listed rows come from each shown host that offers `x-ahpd/plugins/available` | (defaulted: as `mayToggle` shows an action by the host's offer) | 02 |
| A listed entry the host marks installed from its own list is left out; its installed row stands for it | (defaulted: each plugin once) | 02 |
| A README image is drawn as its alt text, and never fetched | (defaulted: a client never contacts a host the list names) | 03 |
| *Install a specific version* is a menu of the gear with the listed versions | (defaulted: as VS Code's gear) | 03 |
| Under 600 pixels the facts column goes under the tabs | (defaulted: as the mockup at 760) | 03 |
| Every new string is in the `en`, `pt` and `es` catalogs | (defaulted: ahpw's catalogs) | 02, 03, 04 |
| New styles go in a CSS file beside their component | file:///github/ahpw/.project/briefs/styles-live-beside-their-component.md | 02, 03 |

## Proposed architecture

- **Data flow** - the bridge asks each host for `available` and keeps nothing; the sidebar and the pages hold the answers in React state.
- **Event flow** - an install answers the row's id; `rereadAfterChange` reads the list again, and the sidebar asks `available` again when the plugin rows change.
- **State flow** - the listed rows, the details and the busy flag live in their components. The scena store keeps only what it keeps today.
- **Layer responsibilities** - bridges: the two calls and the install's marketplace · shell: search rows and a row button · plugins screen: the listed rows and pages.
- **Source-of-truth files** - [`code://src/bridges/plugins.ts`](../../../../src/bridges/plugins.ts), [`code://src/resources/plugins/ListedPluginPage.tsx`](../../../../src/resources/plugins/ListedPluginPage.tsx) once written.

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - The bridge reads the lists](task-01-the-bridge-reads-the-lists.md) | todo | - |
| [02 - One list in the sidebar](task-02-one-list-in-the-sidebar.md) | todo | 01 |
| [03 - A listed plugin's page](task-03-a-listed-plugins-page.md) | todo | 01 |
| [04 - An installed plugin's page gets its list tabs](task-04-an-installed-plugins-page-gets-its-list-tabs.md) | todo | 03 |

## Risks and tradeoffs

- The plan needs the ahpd branch - a host from main offers neither command, and ahpw shows nothing new.
- `available` answers every icon as a `data:` URI - one answer for 12 plugins is about 40 KB, read once each mount.
- A README is the author's text - scena's `Markdown` draws it, and its images are drawn as text.

## Resume state

- **Done so far:** nothing.
- **Next action:** [task-01-the-bridge-reads-the-lists.md](task-01-the-bridge-reads-the-lists.md).
- **Open questions:** none.
- **Watch out for:** the list's id is not the row's id for a first-party plugin, such as `agent-acp` and `ahpd-agent-acp`. Match by `installed.id`.

## Final verification checklist

- [ ] `pnpm typecheck` passes.
- [ ] The vitest suite passes, one suite at a time.
- [ ] On a test ahpd from the branch, a search shows the listed plugins, and Install installs one and opens its page.
- [ ] An installed listed plugin's page has Details, Features and Changelog beside Overview and Options.
- [ ] Each screen matches the mockups at 1280 and 760 px, light and dark.
