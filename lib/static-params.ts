import { createClient } from '@supabase/supabase-js';

type Row = Record<string, unknown>;

export async function fetchStaticParams(
  table: string,
  urlParam = 'id',
  dbColumn = 'id',
  limit = 2000,
): Promise<Record<string, string>[]> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return [{ [urlParam]: '_placeholder' }];

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data } = await supabase.from(table).select(dbColumn).limit(limit);
    if (!data || !Array.isArray(data)) return [{ [urlParam]: '_placeholder' }];

    const items = (data as unknown as Row[]).map((item) => ({
      [urlParam]: String(item[dbColumn] ?? ''),
    }));
    return items.length > 0 ? items : [{ [urlParam]: '_placeholder' }];
  } catch {
    return [{ [urlParam]: '_placeholder' }];
  }
}
