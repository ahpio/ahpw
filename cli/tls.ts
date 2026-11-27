import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

/** A certificate and its private key, as PEM text. */
export interface Tls {
  cert: string;
  key: string;
}

/** `~` at the start of a path, as a shell would read it. A config file has no shell. */
export const expand = (path: string): string => (path === '~' || path.startsWith('~/') ? homedir() + path.slice(1) : path);

/**
 * The certificate and key two paths name, or nothing when neither is given.
 *
 * Both or neither: a certificate without its key serves nothing. `fail` makes
 * the error, so `serve` and `pnpm dev` each say it their own way.
 */
export function tlsOf(cert: unknown, key: unknown, fail: (message: string) => Error, read: (path: string) => string = (path) => readFileSync(path, 'utf8')): Tls | undefined {
  if (cert === undefined && key === undefined) return undefined;
  if (typeof cert !== 'string' || typeof key !== 'string' || cert.trim() === '' || key.trim() === '') throw fail('The TLS certificate and its key go together (--tls-cert and --tls-key, or tlsCert and tlsKey). Give both, or neither.');
  const one = (path: string, what: string): string => {
    try {
      return read(expand(path));
    } catch {
      throw fail(`No TLS ${what} at ${path}.`);
    }
  };
  return { cert: one(cert, 'certificate'), key: one(key, 'key') };
}

/**
 * The name the page is reached by, checked: a bare host name, no scheme, port
 * or path, in lower case. Nothing when none is given.
 */
export function domainOf(domain: unknown, fail: (message: string) => Error): string | undefined {
  if (domain === undefined) return undefined;
  const text = typeof domain === 'string' ? domain.trim() : '';
  let parsed: URL | undefined;
  try {
    parsed = new URL(`http://${text}`);
  } catch {
    parsed = undefined;
  }
  if (text === '' || parsed === undefined || parsed.hostname !== text.toLowerCase() || parsed.port !== '') throw fail(`domain is not a host name: ${String(domain)}.`);
  return parsed.hostname;
}
