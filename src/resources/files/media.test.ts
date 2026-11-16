import { beforeEach, describe, expect, it, vi } from 'vitest';

const sizeOf = vi.fn(async () => 10);
const readBlob = vi.fn(async () => new Blob(['x']));
vi.mock('../../bridges/data.js', () => ({ ROOT: 'ahp-root:/', hostBridge: () => ({ sizeOf, readBlob }) }));

const { FileUrls } = await import('./media.js');

/*
 * A page's reads: a live preview makes an image's element again as it
 * scrolls back, and the image must not be read again.
 */

beforeEach(() => {
  sizeOf.mockClear();
  readBlob.mockClear();
});

describe('FileUrls', () => {
  it('reads a file once, and has it at once after', async () => {
    const urls = new FileUrls();
    expect(urls.peek('h', 'file:///a.png')).toBeNull();
    const first = await urls.get('h', 'file:///a.png');
    const again = await urls.get('h', 'file:///a.png');
    expect(again).toBe(first);
    expect(urls.peek('h', 'file:///a.png')).toBe(first);
    expect(readBlob).toHaveBeenCalledTimes(1);
  });

  it('reads again after it is released', async () => {
    const urls = new FileUrls();
    await urls.get('h', 'file:///a.png');
    urls.release();
    expect(urls.peek('h', 'file:///a.png')).toBeNull();
    await urls.get('h', 'file:///a.png');
    expect(readBlob).toHaveBeenCalledTimes(2);
  });
});
