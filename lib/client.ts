'use client';

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const supabaseClient = createClient()

export async function getSessionWithTimeout(timeoutMs = 10000) {
  const result = await Promise.race([
    supabaseClient.auth.getSession(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Session timeout')), timeoutMs)
    ),
  ]);
  return result;
}
