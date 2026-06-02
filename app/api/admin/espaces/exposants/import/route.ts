import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { createAccountForExposant } from '@/lib/exposant-account';
import type { Database } from '@/types/database.types';
import * as XLSX from 'xlsx';

type ExposantInsert = Database['public']['Tables']['exposants']['Insert'];

const BATCH_SIZE = 50;

interface FlatExposant {
  nom: string;
  secteur: string | null;
  pavillon: string | null;
  stand: string | null;
  pays: string | null;
  description: string | null;
  website: string | null;
  mail1: string | null;
  mail2: string | null;
  phone_contact: string | null;
  tel2: string | null;
  logo_url: string | null;
  reseaux: string | null;
  adresse: string | null;
  site2: string | null;
}

function normalizeKey(key: string): string {
  const s = key.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const lowered = s.toLowerCase().replace(/[\s_-]+/g, '_').replace(/[^a-z0-9_]/g, '');

  if (/raison.*social|nom.*entreprise|company|name|entreprise/.test(lowered)) return 'nom';
  if (/secteur|sector|activite/.test(lowered)) return 'secteur';
  if (/pavillon|pavilion|espace/.test(lowered)) return 'pavillon';
  if (/stand/.test(lowered)) return 'stand';
  if (/pays|country/.test(lowered)) return 'pays';
  if (/description|desc/.test(lowered)) return 'description';
  if (/adresse|address/.test(lowered)) return 'adresse';
  if (/telephone1|tel1|phone1|telephone|phone/.test(lowered) && !lowered.includes('2')) return 'tel1';
  if (/telephone2|tel2|phone2/.test(lowered)) return 'tel2';
  if (/mail1|email1/.test(lowered)) return 'mail1';
  if (/mail2|email2/.test(lowered)) return 'mail2';
  if (/mail|email/.test(lowered) && !lowered.includes('2')) return 'mail1';
  if (/site.*web1|site1|website1|site_web/.test(lowered) && !lowered.includes('2')) return 'site1';
  if (/site.*web2|site2|website2/.test(lowered)) return 'site2';
  if (/reseaux|social|linkedin|facebook|twitter/.test(lowered)) return 'reseaux';
  if (/logo/.test(lowered)) return 'logo';

  return lowered;
}

function parsePavillonCode(raw: string): string | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;
  const match = cleaned.match(/^[A-Za-z0-9]+/);
  return match ? match[0].toUpperCase() : null;
}

function buildInsert(row: FlatExposant, pavillonToEspace: Map<string, { id: string; code: string }>): ExposantInsert | null {
  const nom = row.nom?.trim();
  if (!nom) return null;

  let pavillon = row.pavillon?.trim() || null;
  let espace_id: string | undefined;
  if (pavillon) {
    const code = parsePavillonCode(pavillon);
    const match = code ? pavillonToEspace.get(code) : undefined;
    if (match) {
      espace_id = match.id;
      pavillon = match.code;
    }
  }

  let description = row.description?.trim() || null;
  if (row.adresse?.trim()) {
    description = description
      ? `${description}\n${row.adresse.trim()}`
      : row.adresse.trim();
  }

  const email_contact = row.mail1?.trim() || null;
  const phone_contact = row.phone_contact?.trim() || null;
  const tel2 = row.tel2?.trim() || null;
  const finalPhone = phone_contact && tel2 ? `${phone_contact}, ${tel2}` : (phone_contact || tel2 || null);

  const website = row.website?.trim() || null;
  const site2 = row.site2?.trim() || null;
  const finalWebsite = website && site2 ? `${website}, ${site2}` : (website || site2 || null);

  const reseaux = row.reseaux?.trim() || null;
  const logo_url = row.logo_url?.trim() || null;

  const result: ExposantInsert = {
    nom,
    secteur: row.secteur?.trim() || null,
    pavillon,
    stand: row.stand?.trim() || null,
    pays: row.pays?.trim() || null,
    description,
    website: finalWebsite || reseaux || null,
    email1: row.mail1?.trim() || null,
    email2: row.mail2?.trim() || null,
    email_contact: email_contact || row.mail2?.trim() || null,
    phone_contact: finalPhone,
    logo_url,
    espace_id: espace_id || null,
    is_featured: false,
  };
  return result;
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
  }

  if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
    return NextResponse.json({ error: 'Format de fichier invalide. Utilisez un fichier .xlsx, .xls ou .csv.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: espaces } = await supabase
    .from('espaces')
    .select('id, code')
    .order('code', { ascending: true });

  const pavillonToEspace = new Map<string, { id: string; code: string }>();
  if (espaces) {
    for (const e of espaces) {
      pavillonToEspace.set(e.code.toUpperCase(), { id: e.id, code: e.code });
    }
  }

  let records: FlatExposant[] = [];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'Aucune feuille trouvée dans le fichier.' }, { status: 400 });
    }

    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
    if (!jsonData || jsonData.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée trouvée dans le fichier.' }, { status: 400 });
    }

    const rawKeys = Object.keys(jsonData[0] as Record<string, unknown>);
    const keyMap = new Map<string, string>();
    for (const key of rawKeys) {
      keyMap.set(key, normalizeKey(key));
    }

    records = jsonData.map((row) => {
      const r: FlatExposant = {
        nom: '', secteur: null, pavillon: null, stand: null,
        pays: null, description: null, website: null,
        mail1: null, mail2: null,
        phone_contact: null, tel2: null,
        logo_url: null, reseaux: null, adresse: null,
        site2: null,
      };
      for (const [originalKey, normalizedKey] of keyMap) {
        const val = String(row[originalKey] ?? '').trim();
        if (!val) continue;
        if (normalizedKey === 'nom') r.nom = val;
        else if (normalizedKey === 'secteur') r.secteur = val;
        else if (normalizedKey === 'pavillon') r.pavillon = val;
        else if (normalizedKey === 'stand') r.stand = val;
        else if (normalizedKey === 'pays') r.pays = val;
        else if (normalizedKey === 'description') r.description = val;
        else if (normalizedKey === 'adresse') r.adresse = val;
        else if (normalizedKey === 'tel1') r.phone_contact = val;
        else if (normalizedKey === 'tel2') r.tel2 = val;
        else if (normalizedKey === 'mail1') r.mail1 = val;
        else if (normalizedKey === 'mail2') r.mail2 = val;
        else if (normalizedKey === 'site1') r.website = val;
        else if (normalizedKey === 'site2') r.site2 = val;
        else if (normalizedKey === 'reseaux') r.reseaux = val;
        else if (normalizedKey === 'logo') r.logo_url = val;
      }
      return r;
    });
  } catch {
    return NextResponse.json({ error: 'Erreur de lecture du fichier. Vérifiez le format.' }, { status: 400 });
  }

  const inserts = records
    .map((r) => buildInsert(r, pavillonToEspace))
    .filter((r): r is ExposantInsert => r !== null);

  if (inserts.length === 0) {
    return NextResponse.json({
      error: 'Aucun exposant valide. Vérifiez que la colonne "Raison Sociale" contient des valeurs.',
    }, { status: 400 });
  }

  const { error: insertError } = await supabase.from('exposants').insert(inserts);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: inserted } = await supabase
    .from('exposants')
    .select('id, nom, email1, email2')
    .order('created_at', { ascending: false })
    .limit(inserts.length);

  const withAccounts: { exposantId: string; nom: string; email1: string | null; email2: string | null }[] = [];
  const withoutEmail: string[] = [];

  for (const exp of inserted || []) {
    if (exp.email1 || exp.email2) {
      withAccounts.push({ exposantId: exp.id, nom: exp.nom, email1: exp.email1, email2: exp.email2 });
    } else {
      withoutEmail.push(exp.nom);
    }
  }

  const accountResults: { exposantId: string; nom: string; account: object | null; error?: string }[] = [];

  for (let i = 0; i < withAccounts.length; i += BATCH_SIZE) {
    const batch = withAccounts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((e) => createAccountForExposant(e.exposantId, e.email1, e.email2))
    );
    for (let j = 0; j < batch.length; j++) {
      const r = batchResults[j];
      if (r.status === 'fulfilled') {
        accountResults.push({ exposantId: batch[j].exposantId, nom: batch[j].nom, account: r.value.account ?? null, error: r.value.error });
      } else {
        accountResults.push({ exposantId: batch[j].exposantId, nom: batch[j].nom, account: null, error: r.reason?.toString() });
      }
    }
  }

  const accountsCreated = accountResults.filter((r) => r.account !== null).length;
  const accountErrors = accountResults.filter((r) => r.error);

  return NextResponse.json({
    success: true,
    imported: inserts.length,
    total: records.length,
    accounts_created: accountsCreated,
    without_email: withoutEmail.length,
    errors: accountErrors.length > 0 ? accountErrors.slice(0, 20) : undefined,
  });
}
