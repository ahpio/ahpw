import { expect, test } from 'vitest';
import { boundInfo, boundSubjects, dropSubject, grantCatalog, heldBy, operationState, reached, subjectInfo, subjectsOf, toggleGroup, toggleOperation } from './grants.js';

const BOT = { title: 'Bot', description: 'A bot.', operations: ['get', 'list', 'resolve', 'watch', 'put', 'delete'], groups: { read: ['get', 'list', 'resolve', 'watch'], write: ['put', 'delete'] } };
const catalog = grantCatalog({ 'ahpd.grants': { session: { title: 'Sessions', description: 'S.', operations: ['list', 'state', 'create'], groups: { read: ['list', 'state'], write: ['create'] } }, bot: BOT, broken: 3 } });

test('the catalog is read from the root state, and a host that sends none has an empty one', () => {
  expect(Object.keys(catalog)).toEqual(['session', 'bot']);
  expect(catalog.bot).toEqual(BOT);
  expect(grantCatalog({})).toEqual({});
});

test('a role\'s subjects: the wildcard first, then the catalog\'s order, then the ones the host does not advertise', () => {
  expect(subjectsOf(['plugin:run', 'bot:list', '*:read', 'session:*'], catalog)).toEqual(['*', 'session', 'bot', 'plugin']);
  expect(subjectsOf(['bot:list'], catalog, ['session'])).toEqual(['session', 'bot']);
  expect(subjectInfo('plugin', catalog, ['plugin:run', 'plugin:write', 'plugin:stop'])).toMatchObject({ title: 'plugin', operations: ['run', 'stop'] });
});

test('an operation is granted itself, covered by a group or a wildcard, or not granted', () => {
  const grants = ['bot:list', 'bot:resolve', 'bot:watch', 'bot:write'];
  expect(operationState(grants, 'bot', 'list', BOT)).toEqual({ state: 'on' });
  expect(operationState(grants, 'bot', 'put', BOT)).toEqual({ state: 'implied', by: 'bot:write' });
  expect(operationState(grants, 'bot', 'get', BOT)).toEqual({ state: 'off' });
  expect(operationState(['*:read'], 'bot', 'get', BOT)).toEqual({ state: 'implied', by: '*:read' });
  expect(reached(grants, 'bot', BOT)).toBe(5);
});

test('a click takes a granted operation out, puts an ungranted one in, and splits the group that covers one', () => {
  expect(toggleOperation(['bot:list'], 'bot', 'list', BOT)).toEqual([]);
  expect(toggleOperation([], 'bot', 'get', BOT)).toEqual(['bot:get']);
  expect(toggleOperation(['bot:write'], 'bot', 'put', BOT)).toEqual(['bot:delete']);
  // Every operation: the read group stays whole, the write group loses one.
  expect(toggleOperation(['bot:*'], 'bot', 'delete', BOT)).toEqual(['bot:read', 'bot:put']);
  // A wildcard subject's grant cannot be narrowed for one subject.
  expect(toggleOperation(['*:read'], 'bot', 'get', BOT)).toEqual(['*:read']);
});

test('a group is given or taken away, and a subject goes with all its grants', () => {
  expect(toggleGroup(['bot:list'], 'bot', 'write')).toEqual(['bot:list', 'bot:write']);
  expect(toggleGroup(['bot:write'], 'bot', 'write')).toEqual([]);
  expect(dropSubject(['bot:list', 'session:*', 'bot:write'], 'bot')).toEqual(['session:*']);
});

const host = grantCatalog({ 'ahpd.grants': {
  session: { title: 'Sessions', operations: ['list', 'create', 'dispose'], groups: { read: ['list'], write: ['create', 'dispose'] } },
  chat: { title: 'Chats', operations: ['turns', 'send', 'cancel'], groups: { read: ['turns'], write: ['send', 'cancel'] } },
  usage: { title: 'Usage', operations: ['get', 'records'], groups: { read: ['get', 'records'], write: [] } },
} });

test('a bound holds a grant as ahpd\'s holds does', () => {
  expect(heldBy(['session:*'], 'session:list', host)).toBe(true);
  expect(heldBy(['session:*'], 'session:write', host)).toBe(true);
  expect(heldBy(['session:write'], 'session:create', host)).toBe(true);
  expect(heldBy(['session:write'], 'session:list', host)).toBe(false);
  expect(heldBy(['*:read'], 'usage:get', host)).toBe(true);
  expect(heldBy(['*:read'], 'chat:send', host)).toBe(false);
  expect(heldBy(['*:*'], 'anything:at-all', host)).toBe(true);
  // A chat's groups are the session's.
  expect(heldBy(['session:write'], 'chat:send', host)).toBe(true);
  expect(heldBy(['session:read'], 'chat:turns', host)).toBe(true);
  // A group is held by itself or a wildcard, never by its operations one by one.
  expect(heldBy(['chat:send', 'chat:cancel'], 'chat:write', host)).toBe(false);
});

test('a bound offers the subjects it holds an operation of, in the catalog\'s order', () => {
  expect(boundSubjects(['*:*'], host)).toEqual(['*', 'session', 'chat', 'usage']);
  expect(boundSubjects(['usage:get', 'session:*'], host)).toEqual(['session', 'usage']);
  expect(boundSubjects(['session:read'], host)).toEqual(['session', 'chat']);
});

test('a bound subject keeps only the operations the bound holds', () => {
  expect(boundInfo(host.chat!, 'chat', ['session:write'], host)).toMatchObject({ operations: ['send', 'cancel'], groups: { read: [], write: ['send', 'cancel'] } });
  expect(boundInfo(host.session!, 'session', ['session:*'], host)).toEqual(host.session);
});
