import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  archive: vi.fn(),
  restore: vi.fn(),
  ban: vi.fn(),
  unban: vi.fn(),
}));
vi.mock('@/lib/server/admin', () => ({ requireAdminApiUser: mocks.guard }));
vi.mock('@/features/admin/server/listings', () => ({
  archiveListing: mocks.archive,
  restoreListing: mocks.restore,
}));
vi.mock('@/features/admin/server/users', () => ({ banUser: mocks.ban, unbanUser: mocks.unban }));
// Keep validation real while isolating the auth/database dependencies of the response helper.
vi.mock('@/lib/server/api', () => ({
  handleApiRoute: (fn: () => Promise<unknown>) => fn(),
  apiOk: (data: unknown) => data,
  parseJsonBody: async (request: Request, schema: { parse: (input: unknown) => unknown }) =>
    schema.parse(await request.json()),
}));
import { PATCH } from '@/app/api/admin/listings/[id]/route';
import { POST, DELETE } from '@/app/api/admin/users/[id]/ban/route';

const context = { params: { id: 'target' } };
const request = (body: unknown) =>
  new Request('https://example.com/api/admin/test', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.guard.mockResolvedValue({ id: 'admin' });
});

describe('moderation route authorization and validation', () => {
  it('rejects every action before touching data when the viewer is not an admin', async () => {
    mocks.guard.mockRejectedValue(new Error('NOT_FOUND'));
    for (const action of [
      () => PATCH(request({ status: 'ARCHIVED' }), context),
      () => PATCH(request({ status: 'PAUSED' }), context),
      () => POST(request({ reason: 'Spam', durationDays: null }), context),
      () => DELETE(request({}), context),
    ]) {
      await expect(action()).rejects.toThrow('NOT_FOUND');
    }
    for (const operation of [mocks.archive, mocks.restore, mocks.ban, mocks.unban])
      expect(operation).not.toHaveBeenCalled();
  });
  it('archives or restores only the requested listing', async () => {
    await PATCH(request({ status: 'ARCHIVED' }), context);
    expect(mocks.archive).toHaveBeenCalledWith('target');
    await PATCH(request({ status: 'PAUSED' }), context);
    expect(mocks.restore).toHaveBeenCalledWith('target');
  });
  it('does not allow direct publishing through the admin restore endpoint', async () => {
    await expect(PATCH(request({ status: 'PUBLISHED' }), context)).rejects.toThrow();
    expect(mocks.restore).not.toHaveBeenCalled();
  });
  it('requires a reason for bans and passes authenticated headers to ban/unban', async () => {
    await expect(POST(request({ reason: '', durationDays: null }), context)).rejects.toThrow();
    expect(mocks.ban).not.toHaveBeenCalled();
    const req = request({ reason: 'Spam', durationDays: 7 });
    await POST(req, context);
    expect(mocks.ban).toHaveBeenCalledWith(
      'target',
      { reason: 'Spam', durationDays: 7 },
      req.headers,
    );
    await DELETE(req, context);
    expect(mocks.unban).toHaveBeenCalledWith('target', req.headers);
  });
});
