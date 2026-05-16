import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const offset = (page - 1) * limit;

  const actorId = searchParams.get('actor_id');
  const actorRole = searchParams.get('actor_role');
  const action = searchParams.get('action');
  const entityType = searchParams.get('entity_type');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');
  const search = searchParams.get('search');

  const supabase = createAdminClient();

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' });

  if (actorId) query = query.eq('actor_id', actorId);
  if (actorRole) query = query.eq('actor_role', actorRole);
  if (action) query = query.eq('action', action);
  if (entityType) query = query.eq('entity_type', entityType);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);
  if (search) {
    query = query.or(
      `actor_email.ilike.%${search}%,action.ilike.%${search}%,entity_type.ilike.%${search}%`
    );
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: logs, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs, total: count || 0, page, limit });
}
