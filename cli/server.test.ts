import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { get } from 'node:https';
import { createServer as createTcpServer, connect, type AddressInfo, type Server as TcpServer } from 'node:net';
import { tmpdir } from 'node:os';
import { connect as connectTls } from 'node:tls';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { originAllowed, upstreamPath } from './proxy.js';
import { createWebServer, type WebServer } from './server.js';
import type { Tls } from './tls.js';

let app: string;
const running: { stop(): Promise<void> }[] = [];

beforeAll(() => {
  app = join(mkdtempSync(join(tmpdir(), 'ahpw-cli-')), 'app');
  mkdirSync(join(app, 'assets'), { recursive: true });
  writeFileSync(join(app, 'index.html'), '<!doctype html><title>ahpd</title>');
  writeFileSync(join(app, 'assets', 'a-1.js'), 'export {}');
});

afterEach(async () => {
  await Promise.all(running.splice(0).map((one) => one.stop()));
});

/** A daemon stand-in: answers any handshake with 101, then echoes, and keeps the heads it read. */
async function daemon(): Promise<{ port: number; heads: string[] }> {
  const heads: string[] = [];
  const server: TcpServer = createTcpServer((socket) => {
    let buffered = '';
    const onData = (chunk: Buffer): void => {
      buffered += chunk.toString('latin1');
      const end = buffered.indexOf('\r\n\r\n');
      if (end === -1) return;
      socket.off('data', onData);
      heads.push(buffered.slice(0, end));
      socket.write('HTTP/1.1 101 Switching Protocols\r\nupgrade: websocket\r\nconnection: Upgrade\r\n\r\n');
      const rest = buffered.slice(end + 4);
      if (rest !== '') socket.write(rest);
      socket.pipe(socket);
    };
    socket.on('data', onData);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  running.push({ stop: () => new Promise<void>((resolve) => { server.close(() => resolve()); }) });
  return { port: (server.address() as AddressInfo).port, heads };
}

async function serve(upstream: string, token?: string, client?: { name: string; title: string }): Promise<{ port: number; web: WebServer }> {
  const web = createWebServer({ app, upstream: new URL(upstream), token, client });
  await new Promise<void>((resolve) => web.server.listen(0, '127.0.0.1', resolve));
  running.unshift(web);
  return { port: (web.server.address() as AddressInfo).port, web };
}

/** A raw handshake to the web server; resolves with what came back first. */
function handshake(port: number, path: string, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = connect(port, '127.0.0.1', () => {
      const lines = [`GET ${path} HTTP/1.1`, 'upgrade: websocket', 'connection: Upgrade', 'sec-websocket-key: dGhlIHNhbXBsZSBub25jZQ==', 'sec-websocket-version: 13', 'cookie: secret=1'];
      for (const [name, value] of Object.entries(headers)) lines.push(`${name}: ${value}`);
      socket.write(`${lines.join('\r\n')}\r\n\r\n`);
    });
    socket.once('data', (chunk) => { resolve(chunk.toString('latin1')); socket.destroy(); });
    socket.once('error', reject);
  });
}

describe('originAllowed', () => {
  it('takes the page this server sent, on an address or localhost', () => {
    expect(originAllowed('http://127.0.0.1:5190', '127.0.0.1:5190')).toBe(true);
    expect(originAllowed('http://localhost:5190', 'localhost:5190')).toBe(true);
    expect(originAllowed('http://[::1]:5190', '[::1]:5190')).toBe(true);
    expect(originAllowed('http://192.168.0.4:5190', '192.168.0.4:5190')).toBe(true);
  });

  it('takes an https page, and the configured domain', () => {
    expect(originAllowed('https://127.0.0.1:5190', '127.0.0.1:5190', { secure: true })).toBe(true);
    expect(originAllowed('https://ahpw.example.com', 'ahpw.example.com', { secure: true, domain: 'ahpw.example.com' })).toBe(true);
    expect(originAllowed('http://ahpw.example.com:5190', 'ahpw.example.com:5190', { domain: 'ahpw.example.com' })).toBe(true);
  });

  it('refuses the other scheme, and a name that is not the domain', () => {
    expect(originAllowed('http://127.0.0.1:5190', '127.0.0.1:5190', { secure: true })).toBe(false);
    expect(originAllowed('https://127.0.0.1:5190', '127.0.0.1:5190')).toBe(false);
    expect(originAllowed('https://evil.example', 'evil.example', { secure: true, domain: 'ahpw.example.com' })).toBe(false);
  });

  it('refuses another page, a name that may be rebound, and no origin', () => {
    expect(originAllowed('http://evil.example', '127.0.0.1:5190')).toBe(false);
    expect(originAllowed('http://evil.example:5190', 'evil.example:5190')).toBe(false);
    expect(originAllowed(undefined, '127.0.0.1:5190')).toBe(false);
    expect(originAllowed('null', '127.0.0.1:5190')).toBe(false);
  });
});

describe('upstreamPath', () => {
  const upstream = new URL('ws://127.0.0.1:9187');

  it('adds the token and drops the browser\'s', () => {
    expect(upstreamPath(upstream, '/?tkn=browser&x=1', 'held')).toBe('/?x=1&tkn=held');
  });

  it('passes the browser\'s token on when it holds none', () => {
    expect(upstreamPath(upstream, '/?tkn=browser', undefined)).toBe('/?tkn=browser');
    expect(upstreamPath(upstream, '/', undefined)).toBe('/');
  });

  it('keeps the upstream\'s own path and query', () => {
    expect(upstreamPath(new URL('wss://host/ahp?a=b'), '/', 't')).toBe('/ahp?a=b&tkn=t');
  });
});

describe('createWebServer', () => {
  it('serves the page at the root and says whether it holds the token', async () => {
    const { port } = await serve('ws://127.0.0.1:1', 'held');
    const page = await fetch(`http://127.0.0.1:${port}/`);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('<title>ahpd</title>');
    expect(page.headers.get('content-security-policy')).toContain("frame-ancestors 'none'");
    expect((await fetch(`http://127.0.0.1:${port}/assets/a-1.js`)).headers.get('cache-control')).toContain('immutable');
    expect(await (await fetch(`http://127.0.0.1:${port}/ahpw.json`)).json()).toEqual({ tokenHeld: true, daemon: 'http://127.0.0.1:1' });
  });

  it('names a wss: daemon by its https: root', async () => {
    const { port } = await serve('wss://daemon.example.com:8443/ahp');
    expect(await (await fetch(`http://127.0.0.1:${port}/ahpw.json`)).json()).toEqual({ tokenHeld: false, daemon: 'https://daemon.example.com:8443' });
  });

  it('names the client it was given', async () => {
    const { port } = await serve('ws://127.0.0.1:1', undefined, { name: 'ahpw', title: 'Office' });
    expect(await (await fetch(`http://127.0.0.1:${port}/ahpw.json`)).json()).toEqual({ tokenHeld: false, daemon: 'http://127.0.0.1:1', client: { name: 'ahpw', title: 'Office' } });
  });

  it('says it holds no token when it was given none', async () => {
    const { port } = await serve('ws://127.0.0.1:1');
    expect(await (await fetch(`http://127.0.0.1:${port}/ahpw.json`)).json()).toEqual({ tokenHeld: false, daemon: 'http://127.0.0.1:1' });
  });

  it('carries the socket with the token, and only the handshake headers', async () => {
    const upstream = await daemon();
    const { port } = await serve(`ws://127.0.0.1:${upstream.port}`, 'held');
    const answer = await handshake(port, '/?tkn=browser', { origin: `http://127.0.0.1:${port}`, host: `127.0.0.1:${port}` });
    expect(answer).toMatch(/^HTTP\/1\.1 101/);
    const head = upstream.heads[0] ?? '';
    expect(head.split('\r\n')[0]).toBe('GET /?tkn=held HTTP/1.1');
    expect(head).toContain(`host: 127.0.0.1:${upstream.port}`);
    expect(head).not.toContain('browser');
    expect(head).not.toContain('cookie');
    expect(head).not.toContain('origin');
  });

  it('refuses a socket from another page', async () => {
    const upstream = await daemon();
    const { port } = await serve(`ws://127.0.0.1:${upstream.port}`, 'held');
    const answer = await handshake(port, '/', { origin: 'http://evil.example', host: `127.0.0.1:${port}` });
    expect(answer).toMatch(/^HTTP\/1\.1 403/);
    expect(upstream.heads).toEqual([]);
  });

  it('answers 502 when the daemon is not there', async () => {
    const { port } = await serve('ws://127.0.0.1:1', 'held');
    const answer = await handshake(port, '/', { origin: `http://127.0.0.1:${port}`, host: `127.0.0.1:${port}` });
    expect(answer).toMatch(/^HTTP\/1\.1 502/);
  });
});

/** A self-signed certificate for 127.0.0.1, made with the openssl on this machine; nothing where there is none. */
function selfSigned(): Tls | undefined {
  const dir = mkdtempSync(join(tmpdir(), 'ahpw-tls-'));
  try {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes', '-days', '1', '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1', '-keyout', join(dir, 'key.pem'), '-out', join(dir, 'cert.pem')], { stdio: 'ignore' });
  } catch {
    return undefined;
  }
  return { cert: readFileSync(join(dir, 'cert.pem'), 'utf8'), key: readFileSync(join(dir, 'key.pem'), 'utf8') };
}

const tls = selfSigned();

describe.skipIf(tls === undefined)('createWebServer, over https', () => {
  async function serveTls(upstream: string): Promise<number> {
    const web = createWebServer({ app, upstream: new URL(upstream), token: 'held', tls, domain: 'ahpw.example.com' });
    await new Promise<void>((resolve) => web.server.listen(0, '127.0.0.1', resolve));
    running.unshift(web);
    return (web.server.address() as AddressInfo).port;
  }

  it('serves the page over https', async () => {
    const port = await serveTls('ws://127.0.0.1:1');
    const body = await new Promise<string>((resolve, reject) => {
      get({ host: '127.0.0.1', port, path: '/', ca: tls?.cert }, (response) => {
        let text = '';
        response.on('data', (chunk: Buffer) => { text += chunk.toString(); });
        response.on('end', () => resolve(text));
      }).on('error', reject);
    });
    expect(body).toContain('<title>ahpd</title>');
  });

  it('takes the socket from the https page at the domain, and refuses the http one', async () => {
    const upstream = await daemon();
    const port = await serveTls(`ws://127.0.0.1:${upstream.port}`);
    const open = (origin: string, host: string): Promise<string> => new Promise((resolve, reject) => {
      const socket = connectTls({ host: '127.0.0.1', port, ca: tls?.cert }, () => {
        socket.write(['GET / HTTP/1.1', `host: ${host}`, `origin: ${origin}`, 'upgrade: websocket', 'connection: Upgrade', 'sec-websocket-key: dGhlIHNhbXBsZSBub25jZQ==', 'sec-websocket-version: 13', '', ''].join('\r\n'));
      });
      socket.once('data', (chunk) => { resolve(chunk.toString('latin1')); socket.destroy(); });
      socket.once('error', reject);
    });
    expect(await open(`https://ahpw.example.com:${port}`, `ahpw.example.com:${port}`)).toMatch(/^HTTP\/1\.1 101/);
    expect(await open(`http://127.0.0.1:${port}`, `127.0.0.1:${port}`)).toMatch(/^HTTP\/1\.1 403/);
    expect(upstream.heads).toHaveLength(1);
  });
});
