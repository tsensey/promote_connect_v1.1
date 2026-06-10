import { createAdminClient } from './supabase/admin';

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase.rpc as any)('check_rate_limit', {
      p_ip_key: key,
      p_max_requests: maxRequests,
      p_window_ms: windowMs,
    });

    if (error) {
      console.error('[RateLimit] Error calling check_rate_limit:', error);
      return { allowed: true, remaining: 1, resetAt: Date.now() + windowMs };
    }

    const result = data as any;

    if (result.allowed === false) {
      await supabase.from('audit_logs').insert({
        actor_id: null as any,
        action: 'rate_limit_exceeded',
        entity_type: 'system',
        entity_id: key,
        metadata: { maxRequests, windowMs, remaining: result.remaining },
        actor_role: 'system',
        ip_address: key,
      } as any);
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
    };
  } catch (err) {
    console.error('[RateLimit] Exception:', err);
    return { allowed: true, remaining: 1, resetAt: Date.now() + windowMs };
  }
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'anonymous';
}
