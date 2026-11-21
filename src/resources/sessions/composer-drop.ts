import { useRef, useState, type ClipboardEvent, type DragEvent } from 'react';
import type { MessageAttachment, SessionSummary } from '@microsoft/agent-host-protocol';
import type { DroppedThing, Scena } from '@softov/scena/types';
import { useDropArea, useScena } from '@softov/scena/react';
import { ahpPaths } from '../../bridges/data.js';
import { fileTabOf, viewersOf } from '../files/viewers.js';
import { folderLabel } from '../../bridges/words.js';
import { carriesHostFile, droppedHostFile } from '../folders/drag.js';
import { chatAttachment, resourceAttachment, withToken } from './attachments.js';

/** A dropped tab or row the composer takes, and what it attaches. */
export type Taken =
  | { kind: 'session'; attachment: MessageAttachment }
  | { kind: 'file'; attachment: MessageAttachment; uri: string };

/**
 * What a composer on `host` makes of a tab or a row dropped on it: a session of
 * that host, not the composer's own (`own`), becomes a chat reference; a file
 * tab of that host becomes a file attachment. Anything else is null, and passes
 * on to the surface.
 */
export function asAttachment(scena: Scena, thing: DroppedThing, host: string, own: string | undefined): Taken | null {
  const node = thing.resource as { component?: unknown; host?: unknown; resource?: unknown; uri?: unknown };
  if (node.component === 'SessionPage' && node.host === host && typeof node.resource === 'string') {
    if (node.resource === own) return null;
    const summary = (scena.store.get<SessionSummary[]>(ahpPaths(host).sessions) ?? []).find((one) => one.resource === node.resource);
    return summary === undefined ? null : { kind: 'session', attachment: chatAttachment(summary) };
  }
  const file = fileTabOf(thing.key);
  if (file !== undefined && file.host === host && viewersOf(scena, file.uri).some((viewer) => viewer.component === file.component)) {
    return { kind: 'file', attachment: resourceAttachment(file.uri, false), uri: file.uri };
  }
  return null;
}

/** What a drop over a composer box would do: attach, or with Shift also write the path in as `@path`. */
export type Dropping = 'attach' | 'mention' | null;

/**
 * A composer box as a drop target: a host file from the explorer attaches, and with
 * Shift is also written in as `@path`; this computer's files attach as content.
 * A paste of files, as a screenshot or a copied file, attaches them the same way.
 * A session dropped as a tab or a row becomes a chat reference, and a file tab
 * attaches as a host file does; the tab stays where it was.
 */
export function useComposerDrop({ host: on, own, attach, insert, upload }: {
  /** The host the composer sends to; a file from another host's tree is not dropped. */
  host: string;
  /** The composer's own session, which it does not take as a reference. */
  own?: string;
  attach: (attachment: MessageAttachment) => void;
  insert: (words: string) => void;
  upload: (files: FileList) => void;
}): {
  dropping: Dropping;
  onDragOver: (event: DragEvent) => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onPaste: (event: ClipboardEvent) => void;
} {
  const [dropping, setDropping] = useState<Dropping>(null);
  const scena = useScena();
  // Whether Shift was down at the drop: a file tab then also goes in as `@path`.
  const shift = useRef(false);
  // What the scena drag over the box is, as the drop area judged it last.
  const over = useRef<Taken['kind'] | null>(null);
  // A tab or a row from scena: its own drag, read before the host file and the computer's files.
  const area = useDropArea({
    accepts: (thing) => {
      const taken = asAttachment(scena, thing, on, own);
      over.current = taken?.kind ?? null;
      return taken !== null;
    },
    onDrop: (thing) => {
      const taken = asAttachment(scena, thing, on, own);
      if (taken === null) return;
      if (taken.kind === 'file' && shift.current) {
        const token = `@${folderLabel(taken.uri)}`;
        insert(`${token} `);
        attach(withToken(taken.attachment, token));
        return;
      }
      attach(taken.attachment);
    },
  });
  return {
    dropping,
    onDragOver: (event) => {
      area.props.onDragOver(event as DragEvent<HTMLElement>);
      // The area took it: the box shows what a drop would do, as for a host
      // file, with Shift on a file tab as a mention.
      if (event.isPropagationStopped()) {
        setDropping(event.shiftKey && over.current === 'file' ? 'mention' : 'attach');
        return;
      }
      const host = carriesHostFile(event.dataTransfer);
      if (!host && !Array.from(event.dataTransfer.types).includes('Files')) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      setDropping(host && event.shiftKey ? 'mention' : 'attach');
    },
    onDragLeave: (event) => {
      area.props.onDragLeave(event as DragEvent<HTMLElement>);
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(null);
    },
    onDrop: (event) => {
      setDropping(null);
      shift.current = event.shiftKey;
      area.props.onDrop(event as DragEvent<HTMLElement>);
      if (event.isPropagationStopped()) return;
      const host = droppedHostFile(event.dataTransfer);
      if (host !== null) {
        event.preventDefault();
        if (host.host !== on) return;
        const attachment = resourceAttachment(host.uri, host.directory);
        if (!event.shiftKey) {
          attach(attachment);
          return;
        }
        // As ahpapp: the path goes in as `@path` (a folder with its slash) and the file is attached
        // with that token, so the host gets the file and the text says where it was named.
        const token = `@${folderLabel(host.uri)}${host.directory ? '/' : ''}`;
        insert(`${token} `);
        attach(withToken(attachment, token));
        return;
      }
      if (event.dataTransfer.files.length === 0) return;
      event.preventDefault();
      upload(event.dataTransfer.files);
    },
    onPaste: (event) => {
      const files = pastedFiles(event.clipboardData);
      if (files === null) return;
      event.preventDefault();
      upload(files);
    },
  };
}

/**
 * The files a paste carries, or nothing when it is text. A copy from a document
 * often carries a picture of the selection beside its text: that pastes as text.
 */
export function pastedFiles(data: Pick<DataTransfer, 'types' | 'files'>): FileList | null {
  if (data.files.length === 0 || Array.from(data.types).includes('text/plain')) return null;
  return data.files;
}
