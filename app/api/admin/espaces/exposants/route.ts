import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import type { Database } from '@/types/database.types';

type ExposantUpdate = Database['public']['Tables']['exposants']['Update'];
type ExposantInsert = Database['public']['Tables']['exposants']['Insert'];

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const unlinked = searchParams.get('unlinked') === 'true';

  const supabase = createAdminClient();
  let query = supabase
    .from('exposants')
    .select('*');

  if (unlinked) {
    query = query.is('profile_id', null);
  }

  const { data, error } = await query.order('nom', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exposants: data });
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
  const description = body.description as string | undefined;
  const secteur = body.secteur as string | undefined;
  const espace_id = body.espace_id as string | undefined;
  const pavillon = body.pavillon as string | undefined;
  const stand = body.stand as string | undefined;
  const pays = body.pays as string | undefined;
  const website = body.website as string | undefined;
  const is_featured = body.is_featured as boolean | undefined;
  const email_contact = body.email_contact as string | undefined;
  const phone_contact = body.phone_contact as string | undefined;
  const logo_url = body.logo_url as string | undefined;
  const cover_url = body.cover_url as string | undefined;
  const facebook_url = body.facebook_url as string | undefined;
  const linkedin_url = body.linkedin_url as string | undefined;
  const twitter_url = body.twitter_url as string | undefined;
  const instagram_url = body.instagram_url as string | undefined;
  const brochure_url = body.brochure_url as string | undefined;
  const video_url = body.video_url as string | undefined;
  const chiffre_affaires = body.chiffre_affaires as string | undefined;
  const annee_creation = body.annee_creation as string | undefined;
  const nombre_employes = body.nombre_employes as string | undefined;
  const long_description = body.long_description as string | undefined;
  const gallery_urls = body.gallery_urls as string[] | undefined;

  if (!nom) {
    return NextResponse.json({ error: 'nom requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
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
    email_contact: email_contact || null,
    phone_contact: phone_contact || null,
    logo_url: logo_url || null,
    cover_url: cover_url || null,
    facebook_url: facebook_url || null,
    linkedin_url: linkedin_url || null,
    twitter_url: twitter_url || null,
    instagram_url: instagram_url || null,
    brochure_url: brochure_url || null,
    video_url: video_url || null,
    chiffre_affaires: chiffre_affaires || null,
    annee_creation: annee_creation || null,
    nombre_employes: nombre_employes || null,
    long_description: long_description || null,
    gallery_urls: gallery_urls || null,
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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const id = body.id as string | undefined;
  const nom = body.nom as string | undefined;
  const description = body.description as string | undefined;
  const secteur = body.secteur as string | undefined;
  const espace_id = body.espace_id as string | undefined;
  const pavillon = body.pavillon as string | undefined;
  const stand = body.stand as string | undefined;
  const pays = body.pays as string | undefined;
  const website = body.website as string | undefined;
  const is_featured = body.is_featured as boolean | undefined;
  const email_contact = body.email_contact as string | undefined;
  const phone_contact = body.phone_contact as string | undefined;
  const logo_url = body.logo_url as string | undefined;
  const cover_url = body.cover_url as string | undefined;
  const facebook_url = body.facebook_url as string | undefined;
  const linkedin_url = body.linkedin_url as string | undefined;
  const twitter_url = body.twitter_url as string | undefined;
  const instagram_url = body.instagram_url as string | undefined;
  const brochure_url = body.brochure_url as string | undefined;
  const video_url = body.video_url as string | undefined;
  const chiffre_affaires = body.chiffre_affaires as string | undefined;
  const annee_creation = body.annee_creation as string | undefined;
  const nombre_employes = body.nombre_employes as string | undefined;
  const long_description = body.long_description as string | undefined;
  const gallery_urls = body.gallery_urls as string[] | undefined;

  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 });
  }

  const supabase = createAdminClient();
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
  if (email_contact !== undefined) updateData.email_contact = email_contact;
  if (phone_contact !== undefined) updateData.phone_contact = phone_contact;
  if (logo_url !== undefined) updateData.logo_url = logo_url;
  if (cover_url !== undefined) updateData.cover_url = cover_url;
  if (facebook_url !== undefined) updateData.facebook_url = facebook_url;
  if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
  if (twitter_url !== undefined) updateData.twitter_url = twitter_url;
  if (instagram_url !== undefined) updateData.instagram_url = instagram_url;
  if (brochure_url !== undefined) updateData.brochure_url = brochure_url;
  if (video_url !== undefined) updateData.video_url = video_url;
  if (chiffre_affaires !== undefined) updateData.chiffre_affaires = chiffre_affaires;
  if (annee_creation !== undefined) updateData.annee_creation = annee_creation;
  if (nombre_employes !== undefined) updateData.nombre_employes = nombre_employes;
  if (long_description !== undefined) updateData.long_description = long_description;
  if (gallery_urls !== undefined) updateData.gallery_urls = gallery_urls;

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
  const idsParam = searchParams.get('ids');

  let idsToDelete: string[] = [];
  if (id) idsToDelete.push(id);
  if (idsParam) idsToDelete.push(...idsParam.split(','));

  if (idsToDelete.length === 0) {
    return NextResponse.json({ error: 'id(s) requis' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: exposantData } = await supabase
    .from('exposants')
    .select('id, profile_id')
    .in('id', idsToDelete);

  const hasLinkedProfile = exposantData?.some((exp: any) => exp.profile_id);

  if (hasLinkedProfile) {
    return NextResponse.json(
      { error: 'Un ou plusieurs profils exposants liés à un compte ne peuvent être supprimés' },
      { status: 400 }
    );
  }

  const { error } = await supabase.from('exposants').delete().in('id', idsToDelete);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
