---
title: HTML images draw in the preview
status: done
depends: []
layer: "editor"
refs:
  - "[code://src/resources/editor/livePreview.ts](../../../../src/resources/editor/livePreview.ts) - the preview"
---

## Objective

A README's logo, badges and centred images show in the Markdown preview.

## Files

- `UPDATE: src/resources/editor/livePreview.ts` - an `<img>` tag as an inline picture, an HTML block's images as a block, and an image inside a link.
- `UPDATE: src/resources/editor/livePreview.css` - inline images, their `width` and `height`, and the HTML image row.
- `UPDATE: src/resources/editor/livePreview.test.ts` - the tags read, the heading's image, the badge, and the HTML block.

## Steps

1. Read an `<img>` tag's `src`, `alt`, `width` and `height`.
2. Draw an `<img>` among the text as an inline picture, through `HostImage`.
3. Draw the images of an HTML block in a row, aligned as its first tag says.
4. Draw an image inside a link, and keep the link's Mod-click.

## Validation

- `src/resources/editor/livePreview.test.ts`: the tag's attributes, a heading's image, a badge and an HTML block.
- In a browser, a README with a logo, two badges and a centred image shows all four.

## Resume

Built on 2026-11-15. Only `<img>` is drawn, through `<img>` as `HostImage` draws it, so no script in the file runs.
