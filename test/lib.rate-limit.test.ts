import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

const store = new Map<string, { count: number; resetAt: number }>();

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    rpc: vi.fn().mockImplementation(async (name: string, params: any) => {
      const now = Date.now();
      const entry = store.get(params.p_ip_key);

      if (!entry || now > entry.resetAt) {
        store.set(params.p_ip_key, { count: 1, resetAt: now + params.p_window_ms });
        return { data: { allowed: true, remaining: params.p_max_requests - 1, resetAt: now + params.p_window_ms }, error: null };
      }

      if (entry.count >= params.p_max_requests) {
        return { data: { allowed: false, remaining: 0, resetAt: entry.resetAt }, error: null };
      }

      entry.count++;
      return { data: { allowed: true, remaining: params.p_max_requests - entry.count, resetAt: entry.resetAt }, error: null };
    }),
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    }))
  }))
}));

describe('rateLimit', () => {
  beforeEach(() => {
    store.clear();
  });

  it('allows first request within window', async () => {
    const result = await rateLimit('test-key-1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks when limit exceeded', async () => {
    const key = `test-key-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      await rateLimit(key, 3, 60_000);
    }
    const result = await rateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('allows requests within limit', async () => {
    const key = `test-key-${Date.now() + 1}`;
    const first = await rateLimit(key, 3, 60_000);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await rateLimit(key, 3, 60_000);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it('resets after window expires', async () => {
    const key = `test-key-${Date.now() + 2}`;
    await rateLimit(key, 1, 50);
    const blocked = await rateLimit(key, 1, 50);
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));
    const allowed = await rateLimit(key, 1, 50);
    expect(allowed.allowed).toBe(true);
  });
});
