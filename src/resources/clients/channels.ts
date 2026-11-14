/**
 * What a channel a client follows is, in words, and where a click on it
 * goes: the host's own words for its plugin channels, this app's words for the
 * protocol's channels, and the session a session's channels belong to.
 */

import { translate } from '@softov/scena';
import { ROOT } from '../../bridges/data.js';
import type { Offers } from '../../bridges/offers.js';
import { sessionOfChannel } from '../log/wire.js';
import { AGENTS_SECTION } from '../agents/index.js';
import { AUTOMATIONS_SECTION } from '../automations/index.js';
import { BOTS_SECTION } from '../bots/index.js';
import { COMPUTERS_SECTION } from '../computers/index.js';
import { CONNECTORS_SECTION } from '../connectors/index.js';
import { PLUGINS_SECTION } from '../plugins/index.js';
import { POLICIES_SECTION } from '../policies/index.js';
import { TEAMS_SECTION } from '../teams/index.js';
import { TUNNELS_SECTION } from '../tunnels/index.js';
import { USERS_SECTION } from '../users/index.js';
import { CLIENTS_SECTION } from './index.js';

/** A command and its arguments, run when the channel is clicked. */
export interface ChannelOpen {
  command: string;
  args: Record<string, unknown>;
}

/** One followed channel as the client page lists it. */
export interface ChannelEntry {
  uri: string;
  title: string;
  description?: string;
  /** Absent where this app has no view of the channel. */
  open?: ChannelOpen;
}

/** What `describeChannel` reads from the page. */
export interface ChannelLookup {
  host: string;
  offers: Offers | undefined;
  /** The sessions the client is in, by resource. */
  sessions: readonly string[];
  /** A session's title, as the host names it. */
  titleOf(session: string): string | undefined;
  /** The session a chat belongs to, when this page knows it. */
  sessionOf(chat: string): string | undefined;
}

/** The sidebar section that lists a channel's rows, by the channel's scheme. */
const SECTIONS: Readonly<Record<string, string>> = {
  'x-ahpd-agents': AGENTS_SECTION,
  'x-ahpd-engines': AGENTS_SECTION,
  'ahp-automations': AUTOMATIONS_SECTION,
  'x-ahpd-bots': BOTS_SECTION,
  'x-ahpd-clients': CLIENTS_SECTION,
  'x-ahpd-computers': COMPUTERS_SECTION,
  'x-ahpd-connectors': CONNECTORS_SECTION,
  'x-ahpd-adapters': CONNECTORS_SECTION,
  'x-ahpd-plugins': PLUGINS_SECTION,
  'x-ahpd-policies': POLICIES_SECTION,
  'x-ahpd-teams': TEAMS_SECTION,
  'x-ahpd-projects': TEAMS_SECTION,
  'x-ahpd-tunnels': TUNNELS_SECTION,
  'x-ahpd-users': USERS_SECTION,
  'x-ahpd-roles': USERS_SECTION,
};

/** Where a session's changes are, after the session's own URI. */
const CHANGESET = '/changeset/';

const schemeOf = (uri: string): string => /^([a-z][a-z0-9+.-]*):/i.exec(uri)?.[1]?.toLowerCase() ?? '';

const isSession = (uri: string, at: ChannelLookup): boolean => schemeOf(uri) === 'ahp-session' || at.sessions.includes(uri);

const openSession = (host: string, resource: string): ChannelOpen => ({ command: 'ahp.openSession', args: { host, resource } });

/** A title that names its session when the session has one, and stands alone when it does not. */
function inSession(key: string, session: string | undefined, at: ChannelLookup): string {
  const title = session === undefined ? undefined : at.titleOf(session);
  return title === undefined ? translate(`clients/channels/${key}/title`) : translate(`clients/channels/${key}/titleIn`, { session: title });
}

/** The title, description and view of one channel. */
export function describeChannel(uri: string, at: ChannelLookup): ChannelEntry {
  const words = (key: string): { description: string } => ({ description: translate(`clients/channels/${key}/description`) });
  if (uri === ROOT) {
    return { uri, title: translate('clients/channels/root/title'), ...words('root'), open: { command: 'ahp.openHostInfo', args: { host: at.host } } };
  }
  const cut = uri.indexOf(CHANGESET);
  if (cut > 0 && isSession(uri.slice(0, cut), at)) {
    const session = uri.slice(0, cut);
    const key = uri.slice(cut + CHANGESET.length) === 'uncommitted' ? 'uncommitted' : 'changes';
    return { uri, title: inSession(key, session, at), ...words(key), open: openSession(at.host, session) };
  }
  if (isSession(uri, at)) {
    return { uri, title: at.titleOf(uri) ?? translate('clients/channels/session/title'), ...words('session'), open: openSession(at.host, uri) };
  }
  const scheme = schemeOf(uri);
  if (scheme === 'ahp-chat') {
    const session = sessionOfChannel(uri) ?? at.sessionOf(uri);
    return { uri, title: inSession('chat', session, at), ...words('chat'), ...(session === undefined ? {} : { open: openSession(at.host, session) }) };
  }
  const said = at.offers?.channelWords[scheme];
  const section = SECTIONS[scheme];
  return {
    uri,
    title: said?.title ?? scheme,
    ...(said?.description === undefined ? {} : { description: said.description }),
    ...(section === undefined ? {} : { open: { command: 'sidebar.activate', args: { section } } }),
  };
}

/** Every channel described, in the order of their URIs. */
export function describeChannels(uris: readonly string[], at: ChannelLookup): ChannelEntry[] {
  return [...uris].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).map((uri) => describeChannel(uri, at));
}
