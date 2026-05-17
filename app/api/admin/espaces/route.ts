import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import type { Database } from '@/types/database.types';

type EspaceInsert = Database['public']['Tables']['espaces']['Insert'];
type EspaceUpdate = Database['public']['Tables']['espaces']['Update'];

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('espaces')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ espaces: data });
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const code = body.code as string | undefined;
  const nom = body.nom as string | undefined;
  const description = body.description as string | undefined;
  const type = body.type as string | undefined;
  const sort_order = body.sort_order as number | undefined;

  if (!code || !nom) {
    return NextResponse.json({ error: 'code et nom sont requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const insertData: EspaceInsert = {
    code,
    nom,
    description: description || null,
    type: type || 'pavillon',
    sort_order: sort_order || 0,
  };
  const { data, error } = await supabase
    .from('espaces')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.message?.includes('duplicate') || error.code === '23505') {
      return NextResponse.json({ error: 'Ce code existe deja' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ espace: data }, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = body.id as string | undefined;
  const code = body.code as string | undefined;
  const nom = body.nom as string | undefined;
  const description = body.description as string | undefined;
  const type = body.type as string | undefined;
  const sort_order = body.sort_order as number | undefined;

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const updateData: EspaceUpdate = { code, nom, description: description || null, type, sort_order };
  const { data, error } = await supabase
    .from('espaces')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ espace: data });
}

export async function DELETE(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { count } = await supabase
    .from('exposants')
    .select('id', { count: 'exact', head: true })
    .eq('espace_id', id);

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cet espace est utilise par ${count} exposant(s). Reaffectez-les avant de supprimer.` },
      { status: 409 }
    );
  }

  const { error } = await supabase.from('espaces').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
