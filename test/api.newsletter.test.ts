import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/resend/client', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' } }),
    },
  },
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'admin-id' } },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      const buildChain = (overrides = {}) => {
        const chain: Record<string, ReturnType<typeof vi.fn>> = {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          overlaps: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          is: vi.fn().mockReturnThis(),
          single: vi.fn(),
          maybeSingle: vi.fn(),
          ...overrides,
        };
        return chain;
      };

      if (table === 'profiles') {
        return buildChain({
          select: vi.fn().mockReturnValue(buildChain({
            eq: vi.fn().mockReturnValue(buildChain({
              single: vi.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
            })),
          })),
        });
      }

      if (table === 'newsletter_subscriptions') {
        return buildChain({
          select: vi.fn().mockReturnValue(buildChain({
            eq: vi.fn().mockReturnThis(),
            overlaps: vi.fn().mockReturnThis(),
          })),
        });
      }

      if (table === 'newsletter_editions') {
        return buildChain({
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'edition-1', titre: 'Test', contenu: 'Content', sent_at: null, recipient_count: 2 },
            error: null,
          }),
        });
      }

      if (table === 'user_preferences') {
        return buildChain({
          select: vi.fn().mockReturnValue(buildChain({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
          })),
        });
      }

      return buildChain();
    }),
  })),
}));

describe('POST /api/newsletter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates required fields', async () => {
    const { POST } = await import('../app/api/newsletter/route');

    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'authorization': 'Bearer valid-token', 'content-type': 'application/json' },
      body: JSON.stringify({ titre: '', contenu: '' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Le titre et le contenu sont requis.');
  });
});
