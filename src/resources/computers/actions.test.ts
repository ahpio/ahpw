import { describe, expect, it } from 'vitest';
import { NO_OFFERS } from '../../bridges/offers.js';
import { may, menuOf, writable } from './actions.js';

const offers = (operations: string[]) => ({ ...NO_OFFERS, providers: { computer: { title: '', root: 'computer://', operations } } });
const titles = (grants: readonly string[] | null) => menuOf('h', offers(['list', 'read', 'write', 'delete']), grants, 'box', 'running', true, () => {}).map((one) => ('title' in one ? one.title : ''));

describe('may', () => {
  it('asks for a host that takes the change and for its grant', () => {
    const all = offers(['list', 'read', 'write', 'delete']);
    expect(may(all, ['computer:put'], 'write')).toBe(true);
    expect(may(all, ['computer:put'], 'delete')).toBe(false);
    expect(may(all, ['computer:delete'], 'delete')).toBe(true);
    expect(may(all, ['computer:read'], 'write')).toBe(false);
    expect(may(offers(['list', 'read']), null, 'write')).toBe(false);
    expect(writable(offers(['list', 'read']))).toBe(false);
    expect(writable(all)).toBe(true);
  });

  it('leaves out of the menu what the reader may not do', () => {
    expect(titles(null)).toHaveLength(5);
    expect(titles(['computer:read'])).toHaveLength(2);
    expect(titles(['computer:put'])).toHaveLength(4);
  });
});
