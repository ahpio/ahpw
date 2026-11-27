import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { useI18n } from '@softov/scena/react';
import { Alert, Note, Spinner } from '../../ui/index.js';
import { hostBridge } from '../../bridges/data.js';
import { readFailure } from './save.js';
import { mediaTypeOf } from './icons.js';
import { FileHead } from './text.js';
import { PageAlert } from '../../ui/display/PageAlert.js';

/** Past this size a file is not read, because it arrives whole over the connection. */
export const MAX_BYTES = 64 * 1024 * 1024;

/** A file as a URL the page can draw: null while it reads. */
export type FileUrl = { url: string } | { error: string } | { size: number } | null;

const megabytes = (bytes: number): string => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Reads a file through the host into a blob URL, or says why it is not one. */
const readFileUrl = async (host: string, uri: string): Promise<{ url: string } | { size: number }> => {
  const size = await hostBridge(host).sizeOf(uri);
  if (size !== undefined && size > MAX_BYTES) return { size };
  return { url: URL.createObjectURL(await hostBridge(host).readBlob(uri, mediaTypeOf(uri))) };
};

/**
 * The files a page has read, each read once while the page is open. A live
 * preview makes an image's element again each time it scrolls back into view,
 * and the image then draws at once instead of being read again.
 */
export class FileUrls {
  private readonly read = new Map<string, Promise<FileUrl>>();
  private readonly settled = new Map<string, FileUrl>();

  /** The file once read, or null while it reads or before it is asked for. */
  peek(host: string, uri: string): FileUrl { return this.settled.get(`${host} ${uri}`) ?? null; }

  /** Read the file, or the read already made. */
  get(host: string, uri: string): Promise<FileUrl> {
    const key = `${host} ${uri}`;
    let one = this.read.get(key);
    if (one === undefined) {
      one = readFileUrl(host, uri).catch((error: unknown): FileUrl => ({ error: readFailure(error) }));
      one.then((value) => { this.settled.set(key, value); }, () => {});
      this.read.set(key, one);
    }
    return one;
  }

  /** Revoke every URL read, when the page closes. */
  release(): void {
    for (const value of this.settled.values()) if (value !== null && 'url' in value) URL.revokeObjectURL(value.url);
    this.read.clear();
    this.settled.clear();
  }
}

/**
 * Reads a file through the host into a blob URL, revoked when `uri` changes or
 * the page closes. With `urls`, the page's reads are shared and kept until the
 * page releases them.
 */
export function useFileUrl(host: string, uri: string | undefined, urls?: FileUrls): FileUrl {
  const [state, setState] = useState<FileUrl>(() => (uri === undefined || urls === undefined ? null : urls.peek(host, uri)));
  useEffect(() => {
    if (uri === undefined) return;
    let alive = true;
    if (urls !== undefined) {
      const known = urls.peek(host, uri);
      setState(known);
      if (known === null) void urls.get(host, uri).then((next) => { if (alive) setState(next); });
      return () => { alive = false; };
    }
    let url: string | undefined;
    setState(null);
    readFileUrl(host, uri)
      .then((next) => {
        if ('url' in next) url = next.url;
        if (alive) setState(next);
        else if (url !== undefined) URL.revokeObjectURL(url);
      })
      .catch((error: unknown) => { if (alive) setState({ error: readFailure(error) }); });
    return () => {
      alive = false;
      if (url !== undefined) URL.revokeObjectURL(url);
    };
  }, [host, uri, urls]);
  return state;
}

/** A media file's page: its head, then what `children` draws once the file is read, or why it is not. */
export function MediaFrame({ host, uri, children }: { host: string; uri: string | undefined; children: (url: string) => ReactNode }): ReactElement {
  const { t } = useI18n();
  const state = useFileUrl(host, uri);
  if (uri === undefined) return <PageAlert tone="warning" message={t('files/noFile')} />;
  const head = <FileHead uri={uri} />;
  if (state === null) return <div className="web-file">{head}<Spinner label={t('files/reading')} /></div>;
  if ('error' in state) return <div className="web-file">{head}<Alert tone="danger" title={t('files/notReadable')} message={state.error} /></div>;
  if ('size' in state) {
    return <div className="web-file">{head}<Note inset>{t('files/tooLarge', { size: megabytes(state.size), max: megabytes(MAX_BYTES) })}</Note></div>;
  }
  return <div className="web-file">{head}<div className="web-file__body web-media">{children(state.url)}</div></div>;
}
