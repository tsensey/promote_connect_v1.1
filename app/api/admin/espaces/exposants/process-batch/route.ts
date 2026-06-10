import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdmin } from '@/lib/admin';
import { createAccountForExposant } from '@/lib/exposant-account';

const BATCH_SIZE = 15;

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  // Par défaut on cherche les pending
  // Si le paramètre retry_failed = true est passé, on inclut aussi les failed
  let retryFailed = false;
  try {
    const body = await request.json();
    retryFailed = body.retry_failed === true;
  } catch {
    // ignore
  }

  const supabase = createAdminClient();

  const query = supabase
    .from('exposants')
    .select('id, nom, email1, email2, account_status')
    .in('account_status', retryFailed ? ['pending', 'failed'] : ['pending'])
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  const { data: exposants, error: fetchError } = await query;

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!exposants || exposants.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      remaining: 0,
    });
  }

  const accountResults: { exposantId: string, status: 'created' | 'failed', error?: string }[] = [];

  for (const e of exposants) {
    const result = await createAccountForExposant(e.id, e.email1, e.email2);
    if (result.error) {
      // En cas d'erreur (ex: email invalide, rate limit), on marque comme failed
      await supabase
        .from('exposants')
        .update({ account_status: 'failed' })
        .eq('id', e.id);
      accountResults.push({ exposantId: e.id, status: 'failed', error: result.error });
    } else {
      // Succès
      await supabase
        .from('exposants')
        .update({ account_status: 'created' })
        .eq('id', e.id);
      accountResults.push({ exposantId: e.id, status: 'created' });
    }
    
    // Délai de 250ms pour garantir qu'on ne dépasse pas le rate-limit de Resend (strictement 5 requêtes / seconde)
    // 250ms + le temps d'exécution de la boucle = moins de 4 requêtes / sec
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  const processed = accountResults.length;
  let successCount = 0;
  let failedCount = 0;

  for (const r of accountResults) {
    if (r.status === 'created') {
      successCount++;
    } else {
      failedCount++;
    }
  }

  // Count remaining
  const { count: remainingCount, error: countError } = await supabase
    .from('exposants')
    .select('id', { count: 'exact', head: true })
    .in('account_status', retryFailed ? ['pending', 'failed'] : ['pending']);

  return NextResponse.json({
    success: true,
    processed,
    success_count: successCount,
    failed_count: failedCount,
    remaining: countError ? 0 : (remainingCount || 0),
  });
}
