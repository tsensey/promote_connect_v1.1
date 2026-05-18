import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import type { Database } from '@/types/database.types';

type ProduitInsert = Database['public']['Tables']['produits']['Insert'];
type ProduitUpdate = Database['public']['Tables']['produits']['Update'];

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const exposant_id = searchParams.get('exposant_id');

  const supabase = createAdminClient();
  let query = supabase
    .from('produits')
    .select('*, exposants(nom, profile_id, logo_url)')
    .order('created_at', { ascending: false });

  if (exposant_id) {
    query = query.eq('exposant_id', exposant_id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ produits: data });
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

  const nom = body.nom as string | undefined;
  const exposant_id = body.exposant_id as string | undefined;
  const description = body.description as string | undefined;
  const categorie = body.categorie as string | undefined;
  const type = body.type as string | undefined;
  const prix_indicatif = body.prix_indicatif as string | undefined;
  const image_url = body.image_url as string | undefined;

  if (!nom) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 });
  }

  if (!exposant_id) {
    return NextResponse.json({ error: 'exposant_id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const insertData: ProduitInsert = {
    nom,
    exposant_id,
    description: description || null,
    categorie: categorie || null,
    type: type || null,
    prix_indicatif: prix_indicatif || null,
    image_url: image_url || null,
  };

  const { data, error } = await supabase
    .from('produits')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ produit: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = body.id as string | undefined;
  const nom = body.nom as string | undefined;
  const description = body.description as string | undefined;
  const categorie = body.categorie as string | undefined;
  const type = body.type as string | undefined;
  const prix_indicatif = body.prix_indicatif as string | undefined;
  const image_url = body.image_url as string | undefined;

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const updateData: ProduitUpdate = {};
  if (nom !== undefined) updateData.nom = nom;
  if (description !== undefined) updateData.description = description;
  if (categorie !== undefined) updateData.categorie = categorie;
  if (type !== undefined) updateData.type = type;
  if (prix_indicatif !== undefined) updateData.prix_indicatif = prix_indicatif;
  if (image_url !== undefined) updateData.image_url = image_url;

  const { data, error } = await supabase
    .from('produits')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ produit: data });
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
  const { error } = await supabase.from('produits').delete().eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
