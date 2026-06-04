import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/resend/client', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ data: { id: 'test-email-id' } }),
    },
  },
}));

vi.mock('@react-email/components', () => ({
  render: vi.fn().mockResolvedValue('<html><body>Welcome email</body></html>'),
  Html: ({ children }: any) => children,
  Head: () => null,
  Preview: ({ children }: any) => children,
  Body: ({ children }: any) => children,
  Container: ({ children }: any) => children,
  Section: ({ children }: any) => children,
  Text: ({ children }: any) => children,
  Heading: ({ children }: any) => children,
  Hr: () => null,
  Link: ({ children }: any) => children,
  Img: () => null,
  Button: ({ children }: any) => children,
  Column: ({ children }: any) => children,
  Row: ({ children }: any) => children,
  Tailwind: ({ children }: any) => children,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'profile-id-123', email: 'test@example.com' } },
        error: null,
      }),
    },
  })),
}));

let mockSubscriptionData: { id?: string; unsubscribe_token?: string } | null = null;

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
          update: vi.fn().mockReturnThis(),
          delete: vi.fn().mockReturnThis(),
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
        const hasExisting = typeof mockSubscriptionData === 'object' && mockSubscriptionData !== null;
        return buildChain({
          select: vi.fn().mockReturnValue(buildChain({
            eq: vi.fn().mockReturnThis(),
            overlaps: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue(
              hasExisting
                ? { data: mockSubscriptionData, error: null }
                : { data: null, error: null }
            ),
          })),
          insert: vi.fn().mockReturnValue(buildChain({
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: 'new-sub-id' }, error: null }),
          })),
          update: vi.fn().mockReturnValue(buildChain({
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
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

  it('returns 401 without authorization', async () => {
    const { POST } = await import('../app/api/newsletter/route');

    const req = new Request('http://localhost:3000/api/newsletter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ titre: 'Test', contenu: 'Content' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe('POST /api/newsletter/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptionData = null;
  });

  it('validates required email field', async () => {
    const { POST } = await import('../app/api/newsletter/subscribe/route');

    const req = new Request('http://localhost:3000/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('A valid email is required');
  });

  it('subscribes a new email successfully', async () => {
    const { POST } = await import('../app/api/newsletter/subscribe/route');

    const req = new Request('http://localhost:3000/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', sectors: ['tech'], frequency: 'weekly' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Subscribed successfully');
  });

  it('updates existing subscription', async () => {
    mockSubscriptionData = { id: 'existing-id', unsubscribe_token: 'token-123' };
    const { POST } = await import('../app/api/newsletter/subscribe/route');

    const req = new Request('http://localhost:3000/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'existing@example.com', sectors: ['finance'], frequency: 'daily' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Subscription updated');
  });

  it('rejects invalid email', async () => {
    const { POST } = await import('../app/api/newsletter/subscribe/route');

    const req = new Request('http://localhost:3000/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/newsletter/unsubscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 without token', async () => {
    const { GET } = await import('../app/api/newsletter/unsubscribe/route');

    const req = new Request('http://localhost:3000/api/newsletter/unsubscribe', {
      method: 'GET',
    });

    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/newsletter/subscribe (unsubscribe by email)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates email field', async () => {
    const { DELETE } = await import('../app/api/newsletter/subscribe/route');

    const req = new Request('http://localhost:3000/api/newsletter/subscribe', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    });

    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('A valid email is required');
  });

  it('unsubscribes successfully', async () => {
    const { DELETE } = await import('../app/api/newsletter/subscribe/route');

    const req = new Request('http://localhost:3000/api/newsletter/subscribe', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', authorization: 'Bearer test-token' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toBe('Unsubscribed successfully');
  });
});
