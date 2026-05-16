import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import type { Database } from '@/types/database.types';

type ExposantUpdate = Database['public']['Tables']['exposants']['Update'];
type ExposantInsert = Database['public']['Tables']['exposants']['Insert'];

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const supabase = createAdminClient();
  void auth;

  const { data, error } = await supabase
    .from('exposants')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exposants: data });
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { nom, description, secteur, espace_id, pavillon, stand, pays, website, is_featured } = body;

  if (!nom) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  void auth;

  const insertData: ExposantInsert = {
    nom,
    description: description || null,
    secteur: secteur || null,
    espace_id: espace_id || null,
    pavillon: pavillon || null,
    stand: stand || null,
    pays: pays || null,
    website: website || null,
    is_featured: is_featured || false,
  };

  const { data, error } = await supabase
    .from('exposants')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exposant: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { id, nom, description, secteur, espace_id, pavillon, stand, pays, website, is_featured } = body;

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  void auth;

  const updateData: ExposantUpdate = {};
  if (nom !== undefined) updateData.nom = nom;
  if (description !== undefined) updateData.description = description;
  if (secteur !== undefined) updateData.secteur = secteur;
  if (espace_id !== undefined) updateData.espace_id = espace_id;
  if (pavillon !== undefined) updateData.pavillon = pavillon;
  if (stand !== undefined) updateData.stand = stand;
  if (pays !== undefined) updateData.pays = pays;
  if (website !== undefined) updateData.website = website;
  if (is_featured !== undefined) updateData.is_featured = is_featured;

  const { data, error } = await supabase
    .from('exposants')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exposant: data });
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
  void auth;

  const { error } = await supabase.from('exposants').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
