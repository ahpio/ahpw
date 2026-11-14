import { expect, test } from 'vitest';
import { NO_OFFERS } from '../../bridges/offers.js';
import { describeChannels, type ChannelLookup } from './channels.js';

const SESSION = 'ahp-session:/8cf0f145';
const CHAT = 'ahp-chat:/2f5671ac';

const lookup = (over: Partial<ChannelLookup> = {}): ChannelLookup => ({
  host: 'h',
  offers: {
    ...NO_OFFERS,
    channels: ['x-ahpd-tunnels', 'x-ahpd-summary'],
    channelWords: {
      'x-ahpd-tunnels': { title: 'Tunnels', description: 'The tunnels this host keeps.' },
      'x-ahpd-summary': { title: 'Summary' },
    },
  },
  sessions: [],
  titleOf: (session) => (session === SESSION ? 'Refine the page' : undefined),
  sessionOf: (chat) => (chat === CHAT ? SESSION : undefined),
  ...over,
});

test('in the order of their URIs, each with its words and its view', () => {
  const uris = ['x-ahpd-tunnels://', 'ahp-root://', `${SESSION}/changeset/uncommitted`, 'x-ahpd-summary://', CHAT, SESSION];
  expect(describeChannels(uris, lookup())).toEqual([
    { uri: CHAT, title: 'Chat in Refine the page', description: "A chat's turns and messages.", open: { command: 'ahp.openSession', args: { host: 'h', resource: SESSION } } },
    { uri: 'ahp-root://', title: 'Host', description: "The host's agents and the sessions it holds.", open: { command: 'ahp.openHostInfo', args: { host: 'h' } } },
    { uri: SESSION, title: 'Refine the page', description: 'A session: its chats, files and changes.', open: { command: 'ahp.openSession', args: { host: 'h', resource: SESSION } } },
    {
      uri: `${SESSION}/changeset/uncommitted`,
      title: 'Uncommitted changes in Refine the page',
      description: 'The files the session changed and did not commit.',
      open: { command: 'ahp.openSession', args: { host: 'h', resource: SESSION } },
    },
    { uri: 'x-ahpd-summary://', title: 'Summary' },
    { uri: 'x-ahpd-tunnels://', title: 'Tunnels', description: 'The tunnels this host keeps.', open: { command: 'sidebar.activate', args: { section: 'ahp:tunnels' } } },
  ]);
});

test('a chat whose session this page does not know, and a channel the host does not describe', () => {
  const [chat, unknown] = describeChannels([CHAT, 'x-other://'], lookup({ sessionOf: () => undefined, offers: undefined }));
  expect(chat).toEqual({ uri: CHAT, title: 'Chat', description: "A chat's turns and messages." });
  expect(unknown).toEqual({ uri: 'x-other://', title: 'x-other' });
});

test('a session the client is in, under a scheme other than ahp-session', () => {
  const [session] = describeChannels(['cofold:/abc'], lookup({ sessions: ['cofold:/abc'], titleOf: () => undefined }));
  expect(session).toEqual({ uri: 'cofold:/abc', title: 'Session', description: 'A session: its chats, files and changes.', open: { command: 'ahp.openSession', args: { host: 'h', resource: 'cofold:/abc' } } });
});
