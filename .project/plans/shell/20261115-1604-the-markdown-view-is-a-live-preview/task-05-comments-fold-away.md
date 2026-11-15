---
title: Comments fold away
status: implemented
depends: [task-01-a-mockup-of-the-live-preview.md]
layer: "files"
refs:
  - "[code://src/resources/files/SharedFilePage.tsx](../../../../src/resources/files/SharedFilePage.tsx) - the margin, the thread under its line, and the add-comment button"
  - "[code://src/resources/files/save-mode.ts](../../../../src/resources/files/save-mode.ts) - `chatChoice`, the pattern for a UI setting with a default"
---

## Objective

The file view starts at full width, and a person opens the comments they want.

## Files

- `UPDATE: src/resources/files/SharedFilePage.tsx` - the 💬 button, the hidden mode and the floating card.
- `UPDATE: src/resources/files/comments.css` - the floating card, beside its line.
- `UPDATE: src/resources/files/Threads.tsx` - the card's `›` close, pinned to its top right.
- `CREATE: src/resources/files/comments-shown.ts` - the UI setting: comments shown or hidden when a file opens.
- `UPDATE: src/shell/ui-settings/settings.ts` - the setting in the UI settings.
- `UPDATE: src/i18n/en.json` - the button, the close and the setting, and the same keys in each other catalog.

## Steps

1. Add 💬 with the count of open comments after ✎; it shows or hides the margin.
2. Hide the margin when the setting says so, and give the editor the full width.
3. With the margin hidden, open a clicked thread as a card beside its line.
4. Close the card on `›`, on Escape, or on a click in the text away from it.
5. With the margin shown, keep today's column.
6. Keep the narrow layout: a thread opens under its line.

## Validation

- A file opens with the margin hidden, and the editor uses the full width.
- A click on a comment's words opens its card beside its line; `›` closes it.
- 💬 shows the margin with every thread, and hides it again.
- The setting opens files with the margin shown.
- Each screen matches the approved mockup.

## Resume

Built on 2026-11-15.
- A mousedown in the text away from a comment's words closes the card.
- Checked in a browser at 1280 light and 760 dark: a new comment, its card, Escape, `›`, and 💬.
