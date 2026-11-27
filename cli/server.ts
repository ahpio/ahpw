import { createServer, type IncomingMessage, type Server } from 'node:http';
import { createServer as createSecureServer } from 'node:https';
import type { Duplex } from 'node:stream';
import { toNodeListener } from '@cofold/remote';
import { staticRoute } from '../plugin/static.js';
import { socketProxy } from './proxy.js';
import type { Tls } from './tls.js';

/** What the page reads to learn that this server adds the token, so it asks for none. */
export const SERVER_FILE = '/ahpw.json';

/** What the web server serves, and the daemon it carries the socket to. */
export interface WebServerOptions {
  /** The built page. */
  app: string;
  /** The daemon's AHP socket, `ws:` or `wss:`. */
  upstream: URL;
  /** The token added to the socket. Absent, the page signs in and its own is passed on. */
  token?: string | undefined;
  /** What the page tells the AHP server it is, sent in `ahpw.json`. Absent, the page's own default. */
  client?: { name: string; title: string } | undefined;
  /** The certificate and key to serve https with. Absent, plain http. */
  tls?: Tls | undefined;
  /** The name the page is reached by, whose page may open the socket as an address's may. */
  domain?: string | undefined;
}

/** The server, and how to stop it with every socket it carries. */
export interface WebServer {
  server: Server;
  /** Stops listening and ends every connection, sockets included. */
  stop(): Promise<void>;
}

/** The page at `/`, and its socket carried to the daemon. Not listening yet. */
export function createWebServer(options: WebServerOptions): WebServer {
  const files = staticRoute(options.app, '/');
  // The daemon's HTTP root, which a page served from here cannot see: a connector's URL starts with it.
  const daemon = new URL(options.upstream.href.replace(/^ws(s?):/, 'http$1:')).origin;
  const about = JSON.stringify({ tokenHeld: options.token !== undefined, daemon, ...(options.client === undefined ? {} : { client: options.client }) });
  const route = async (request: Request): Promise<Response> => {
    if (new URL(request.url).pathname !== SERVER_FILE) return await files(request);
    return new Response(about, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  };
  const listener = toNodeListener(route);
  const server: Server = options.tls === undefined ? createServer(listener) : createSecureServer({ cert: options.tls.cert, key: options.tls.key }, listener);
  const proxy = socketProxy(options.upstream, options.token, { secure: options.tls !== undefined, domain: options.domain });
  const carried = new Set<Duplex>();
  server.on('upgrade', (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    carried.add(socket);
    socket.on('close', () => carried.delete(socket));
    proxy(request, socket, head);
  });
  const stop = (): Promise<void> => new Promise((resolve) => {
    server.close(() => resolve());
    server.closeAllConnections();
    for (const socket of carried) socket.destroy();
  });
  return { server, stop };
}
