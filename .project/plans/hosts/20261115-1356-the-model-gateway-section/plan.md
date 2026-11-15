---
title: The model gateway section
domain: hosts
status: active
priority: high
created: 2026-11-15
revalidated: 2026-11-15
requires: []
changes: []
creates: []
refs:
  - git://7496ed4 - the commit of ahpw this plan was checked at
  - https://github.com/ahpio/ahpd/blob/main/.project/plans/proxy/20261115-1352-the-model-proxy-is-the-model-gateway/plan.md - the ahpd plan that renames the model proxy to the model gateway
  - "[code://src/resources/host/sections.ts#L16-L19](../../../../src/resources/host/sections.ts#L16-L19) - the daemon section `modelProxy`, which also reads `proxy`"
  - "[code://src/i18n/en.json#L2267](../../../../src/i18n/en.json#L2267) - the section's label `Model proxy`, at the same line in `es.json` and `pt.json`"
  - "[code://src/bridges/people.ts#L180-L189](../../../../src/bridges/people.ts#L180-L189) - `BUILT_IN_ROLES`, the copy of ahpd's built-in roles, with `proxy:read` and `proxy:write`"
  - "[code://src/resources/emojis.ts#L159-L160](../../../../src/resources/emojis.ts#L159-L160) - the icon of a usage record that the model proxy wrote"
  - "[code://src/resources/usage/Records.tsx#L12-L17](../../../../src/resources/usage/Records.tsx#L12-L17) - `SOURCES`, the icon of what wrote a record, typed by the sdk's usage source"
  - "[code://package.json#L68](../../../../package.json#L68) - ahpw builds against `@ahpd/sdk@^0.15.0-rc.2`, which still types the source `proxy`"
---

## Goal

ahpw says model gateway where it said model proxy, to match the ahpd plan in its `refs`.
The daemon settings show a `Model gateway` section, and a usage record that the gateway wrote shows its icon.
ahpw reads no old name, as ahpd does not.

## Reconnaissance

The files read and the patterns to reuse are the `refs` in the frontmatter, each with its note.

### Searches performed

- `git grep -n "modelProxy\|'proxy'\|proxy:\|Model proxy\|Proxy de modelos" -- src` - the section, the labels, the built-in roles, the icon, the usage icons and three bridge tests.
- `grep -n "@ahpd/sdk" package.json` - a dev dependency on `^0.15.0-rc.2`, locked at `0.15.0-rc.2`.

### Runtime path

```
host root config -> sections.ts DAEMON -> the modelGateway section -> its label from i18n
usage://records -> UsageEntry.source -> Records.tsx SOURCES -> the icon
```

### Gaps

- The labels say proxy, and the section reads the old key `proxy`.
- `SOURCES` is typed by the sdk's union, so a `gateway` key does not compile until ahpw builds against an sdk with the new source.

## Answers

| What | Source | Task |
| --- | --- | --- |
| ahpw follows the ahpd rename, in its own plan and PR after ahpd's | the ahpd brief, which Softov had committed on 2026-11-15 | 01 |
| No old name is read: the section drops `modelProxy` and `proxy` | Softov, 2026-11-15, chose "No migration, old names break" | 01 |
| The labels are `Model gateway` in `en`, and `Gateway de modelos` in `pt` and `es` | the ahpd brief | 01 |
| `SOURCES` is keyed by plain strings, so ahpw builds against the sdk it has | (defaulted: no release before the PR, and an unknown source shows no icon, as today) | 01 |
| A usage record's source word is `Gateway`, and a source ahpw does not know reads as it is, as `kindWord` does | (defaulted: the plan did not name the `usage/record/sources` key) | 01 |
| The `http` alias of the listener section stays | (defaulted: it is not part of this rename) | 01 |
| This session builds the plan | Softov, 2026-11-15, chose "Brief, then plan, then I build" | 01 |

## Proposed architecture

- **Data flow** - The host sends `modelGateway`, and the section shows it under its new label.
- **Event flow** - Unchanged.
- **State flow** - Unchanged.
- **Layer responsibilities** - `src/resources/host`: the section · `src/i18n`: the labels · `src/bridges/people.ts`: the built-in roles · `src/resources/usage`: the icons.
- **Source-of-truth files** - [`code://src/resources/host/sections.ts`](../../../../src/resources/host/sections.ts).

## Tasks

| Task | Status | Depends on |
| --- | --- | --- |
| [01 - ahpw says model gateway](task-01-ahpw-says-model-gateway.md) | implemented | - |

## Risks and tradeoffs

- A host before the ahpd rename sends `modelProxy`, which ahpw then shows in no section.
- Old usage records say `source: 'proxy'`, and show no icon.
- The shared checkout `/github/ahpw` has edits to the three i18n files on `shell/manage-menu-groups`, and `shell/20261115-1038-comments-in-a-file` adds 57 i18n lines. The rename touches one line of each file, so a merge conflict is unlikely.

## Resume state

- **Done so far:** task 01, 2026-11-15, in one PR that waits for Softov's review and for ahpd #345.
- **Next action:** merge after ahpd #345, then [implemented.md](implemented.md) closes the plan.
- **Open questions:** none.
- **Departures:** the source icon and word moved from `Records.tsx` to `sourceIcon` and `sourceWord` in `usage/words.ts`, with `words.test.ts`. The `usage/record/sources` label is `gateway` in the three i18n files. In the manifest test, `project` is `Pr` now that no `proxy` shares its start.
- **Watch out for:** the `network` section's `http.proxy` keys are VS Code's outgoing proxy, not the model gateway.

## Final verification checklist

- [ ] The daemon settings of a host with the rename show `Model gateway`.
- [ ] A usage record of a gateway call shows `⇄`.
- [ ] `git grep -n -i "modelProxy\|model proxy\|proxy de modelos" -- src` finds nothing.
- [ ] `pnpm typecheck` and the suite pass.
