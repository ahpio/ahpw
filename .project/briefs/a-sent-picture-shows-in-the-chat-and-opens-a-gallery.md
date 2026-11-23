---
title: A sent picture shows in the chat and opens a gallery
created: 2026-11-23
refs:
  - git://fb04f4c - the commit of this repository the facts were checked at
  - "[code://src/resources/sessions/Page.tsx#L122-L142](../../src/resources/sessions/Page.tsx#L122-L142) - `SentAttachments`: every sent attachment is a chip, and a file chip runs `ahp.openFile`"
  - "[code://src/resources/sessions/Page.tsx#L174](../../src/resources/sessions/Page.tsx#L174) - where a turn draws `SentAttachments` above its message"
  - "[code://src/resources/sessions/Attached.tsx#L38-L49](../../src/resources/sessions/Attached.tsx#L38-L49) - `AttachmentPreview`: a modal with the picture at its own size, for bytes the message carries"
  - "[code://src/resources/sessions/attachments.ts#L121-L137](../../src/resources/sessions/attachments.ts#L121-L137) - `hasPreview` and `previewOf`: only an `embeddedResource` has a preview"
  - "[code://src/resources/files/ImagePage.tsx#L11-L107](../../src/resources/files/ImagePage.tsx#L11-L107) - the image page: the bar and the wheel zoom, a drag pans, a double click fits"
  - "[code://src/bridges/data.ts#L449-L450](../../src/bridges/data.ts#L449-L450) - `readBase64`, the `resourceRead` a picture on the host is read with"
  - https://github.com/microsoft/vscode/blob/1564f100807a84771bfb1a9886fff6eeaca6b147/src/vs/workbench/contrib/chat/browser/chatImageCarouselService.ts#L93-L159 - VS Code collects the pictures of a chat into one section per request
  - https://github.com/microsoft/vscode/blob/1564f100807a84771bfb1a9886fff6eeaca6b147/src/vs/workbench/contrib/chat/browser/chatImageCarouselService.ts#L275-L297 - the gallery's title, "Conversation Images", and the place it opens at
  - https://github.com/ahpio/ahpd/blob/4ac58cbbc93cb4c3b4fe766646a732f366b42e66/packages/sdk/src/host/attachments.ts - ahpd writes the bytes of every embedded attachment to a file and sends the message on with the file's path
  - file:///github/ahpapp/src/components/ImageViewer.tsx - ahpapp's gallery at `softov/ahpapp@bb1d2a0`, built from the same reference
---

# A sent picture shows in the chat and opens a gallery

A picture a person sends stays a picture in the chat. It is drawn as a thumbnail over the message that carried it. A click on it opens a gallery of every picture in the chat, at the one clicked, with zoom. Today a sent picture is a chip with a name. A click on it opens the image page in a new tab, one picture at a time. Softov asked for this after seeing VS Code's chat, and ahpapp has it at `bb1d2a0`.

## What others do

- **VS Code** draws a sent picture as a thumbnail above the request. A hover shows a larger picture with its path.
- A click opens the image carousel. It collects every picture of the chat into one section per request. The section title is the request's text, as [`collectCarouselSections`](https://github.com/microsoft/vscode/blob/1564f100807a84771bfb1a9886fff6eeaca6b147/src/vs/workbench/contrib/chat/browser/chatImageCarouselService.ts#L93-L159) builds it.
- The carousel opens at the picture that was clicked. It has arrows at the sides, a counter such as `11 / 13`, and a strip of thumbnails under the picture.
- A picture it cannot decode, such as HEIC, is a warning mark in the strip.
- **ahpapp**, at `softov/ahpapp@bb1d2a0`, follows VS Code. It draws an 88 px thumbnail over the bubble. The gallery covers the whole screen and has the counter, the arrows, the strip, keys and swipe. A picture is read from the host once and kept, 24 at a time. Each picture is one item, with no sections.

## What ahpw has today

- **Sent attachments:** `SentAttachments` draws every attachment as a chip with an icon and a label ([`code://src/resources/sessions/Page.tsx#L122-L142`](../../src/resources/sessions/Page.tsx#L122-L142)).
- **Embedded picture:** a chip with an `embeddedResource` opens `AttachmentPreview`, a modal with the picture at its own size and no zoom ([`code://src/resources/sessions/Attached.tsx#L38-L49`](../../src/resources/sessions/Attached.tsx#L38-L49)).
- **Picture on the host:** a chip with a `uri` runs `ahp.openFile`, which opens the image page in a tab.
- **Image page:** it zooms with a bar and the wheel, pans with a drag and fits on a double click ([`code://src/resources/files/ImagePage.tsx#L11-L107`](../../src/resources/files/ImagePage.tsx#L11-L107)).
- **What a sent picture becomes:** ahpd writes the bytes of an embedded attachment to a file before the action is applied. The message then carries a `resource` with a `file:` URI. The type is under `_meta['vscode.agentHost.snapshotAttachment'].contentType`. So every picture in a sent message is a file, and only a picture still in the composer has its bytes in hand.
- **Reading a file:** `readBase64` reads a file on the host as base64 ([`code://src/bridges/data.ts#L449-L450`](../../src/bridges/data.ts#L449-L450)).
- **Missing:** no thumbnail is drawn in the chat, and nothing collects the pictures of a chat.

## Who writes

- **Other sessions on ahpw `main`:** `Page.tsx` is the session page, and other plans change it often. Recent ones are `sessions/20261121-0639` and `sessions/20261119-0831`. The change is one component in place of `SentAttachments`, so it meets them only at its call at line 174.
- **`Attached.tsx`:** the composer's attachments and `AttachmentPreview` live here. The change can reuse the gallery for a picture in the composer, as ahpapp does.
- **ahpapp:** a separate repository. Nothing is shared in code; only the behaviour is the same.

## The change

- A sent attachment whose type is an image is drawn as a thumbnail over the turn's message, in place of its chip. Other attachments stay chips.
- The type comes from the attachment's `contentType`, else from the snapshot tag, else from the file's extension.
- A thumbnail reads its picture with `readBase64` once, and the answer is kept for the page.
- A click on a thumbnail opens a gallery of every picture in the chat, in order, at the one clicked.
- The gallery has arrows, the left and right keys, Escape to close, a counter, and a strip of thumbnails.
- The gallery zooms and pans as the image page does. The zoom code is shared with the image page, not copied.
- A picture the browser cannot decode, such as HEIC, is a warning mark in the strip, and its page says so.
- A picture in the composer opens the same gallery, with that one picture.
- A hover on a thumbnail shows the picture larger, with its path, as VS Code does.

## Open points

- Does the gallery group the pictures by request, with the request's text as a title, as VS Code does? Or is it one flat list, as ahpapp has?
- Does the gallery open as a modal over the page, or as a tab beside the session, as the image page does?
- How large is a thumbnail? ahpapp uses 88 px.
