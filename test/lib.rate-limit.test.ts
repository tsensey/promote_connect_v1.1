import { describe, it, expect } from 'vitest';
import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  it('allows first request within window', () => {
    const result = rateLimit('test-key-1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks when limit exceeded', () => {
    const key = `test-key-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      rateLimit(key, 3, 60_000);
    }
    const result = rateLimit(key, 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('allows requests within limit', () => {
    const key = `test-key-${Date.now() + 1}`;
    const first = rateLimit(key, 3, 60_000);
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = rateLimit(key, 3, 60_000);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it('resets after window expires', async () => {
    const key = `test-key-${Date.now() + 2}`;
    rateLimit(key, 1, 50);
    const blocked = rateLimit(key, 1, 50);
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));
    const allowed = rateLimit(key, 1, 50);
    expect(allowed.allowed).toBe(true);
  });
});
