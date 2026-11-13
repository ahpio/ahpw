import { beforeEach, describe, expect, it, vi } from 'vitest';
import { restartWithNotice } from './restart.js';

const { confirm, restartHost, done, warn } = vi.hoisted(() => ({ confirm: vi.fn(), restartHost: vi.fn(), done: vi.fn(), warn: vi.fn() }));

vi.mock('../../shell/notify/index.js', () => ({ confirm }));
vi.mock('../../shell/notify/say.js', () => ({ done, warn, failed: vi.fn() }));
vi.mock('../../bridges/restart.js', () => ({ restartHost, mayForce: () => true }));

beforeEach(() => {
  confirm.mockReset();
  done.mockReset();
  warn.mockReset();
  restartHost.mockReset().mockResolvedValue({ restarting: true, pid: 7 });
});

describe('restarting from the page', () => {
  it('asks first, and restarts nothing on a no', async () => {
    confirm.mockResolvedValue(false);
    await restartWithNotice('h');
    expect(confirm).toHaveBeenCalledOnce();
    expect(restartHost).not.toHaveBeenCalled();
    confirm.mockResolvedValue(true);
    await restartWithNotice('h');
    expect(restartHost).toHaveBeenCalledWith('h', false);
  });

  it('does not ask again for Restart anyway', async () => {
    await restartWithNotice('h', true);
    expect(confirm).not.toHaveBeenCalled();
    expect(restartHost).toHaveBeenCalledWith('h', true);
  });

  it('names the sessions a held restart waits for, and offers Restart anyway', async () => {
    confirm.mockResolvedValue(true);
    restartHost.mockResolvedValue({ restarting: false, pid: 7, parked: ['claude:/a', 'claude:/b'] });
    await restartWithNotice('h', false, (session) => (session === 'claude:/a' ? 'Fix the tests' : session));
    expect(done).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    const [, said] = warn.mock.calls[0] as [string, { description: string; actions: { args: unknown }[]; dismissAuto: boolean }];
    expect(said.description).toContain('Fix the tests, claude:/b');
    expect(said.actions[0]?.args).toEqual({ host: 'h', force: true });
    expect(said.dismissAuto).toBe(false);
  });
});
