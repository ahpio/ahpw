---
title: Tabs are kept on every surface
status: done
depends: []
layer: "shell"
refs:
  - "[code://src/shell/tabs.ts#L10-L42](../../../../src/shell/tabs.ts#L10-L42) - `keeper` and `keepTabs`"
---

## Objective

`keepTabs` keeps and reopens the tabs of `main`, of the right sidebar and of each window surface, each on its own surface.
The right sidebar's fixed panes are not kept.

## Files

- `UPDATE: src/shell/tabs.ts:10-42` - keep the three kinds of surface; drop the title kept by hand.
- `UPDATE: src/shell/tabs.test.ts` - the surfaces kept, the panes left out, the reopening.

## Steps

1. Write `kept(surface)`, true for `main`, `sidebar:right` and a surface `isWindowSurface` names.
2. In `keeper`, save the mounts on a kept surface, and leave out a mount that `mountRight` placed.
3. Remove `KeptMount.title`; scena's snapshot keeps the props.
4. In `keepTabs`, reopen each mount on its own surface, with its props.
5. Read the focused tab of each surface before reopening, and focus it again after.

## Validation

- `src/shell/tabs.test.ts`: a tab on each kept surface comes back on it, with its title.
- The same test: a `mountRight` pane is not saved.
- `npx vitest run` passes.

## Resume

- Done 2026-11-21: steps 1 to 5. A view `mountRight` holds is told by `isView` in `right-sidebar.ts`; on `main` it is still kept, as before.
- The saved props hold the title only, so a reopened tab shows the component's current icon, as the old code meant.
- A save from before scena 0.8.0 keeps its title in `title`; the reopening still reads it.
- `tsc -b` and the tests pass.
