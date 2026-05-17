import { createAdminClient } from '@/lib/supabase/admin';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new Response(
        `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Désabonnement — PROMOTE-CONNECT</title>
<style>
  body{margin:0;padding:32px 16px;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#172554}
  .card{max-width:480px;margin:40px auto;background:#fff;border-radius:28px;padding:40px 32px;text-align:center;box-shadow:0 20px 60px rgba(15,23,42,0.1)}
  h1{font-size:24px;margin:0 0 12px}
  p{color:#64748b;line-height:1.7;margin:0 0 24px;font-size:15px}
  .btn{display:inline-block;background:#912450;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px}
</style>
</head>
<body>
<div class="card">
  <h1>Lien invalide</h1>
  <p>Le lien de désabonnement est invalide ou manquant. Connectez-vous à votre espace pour gérer vos préférences.</p>
  <a href="/newsletter" class="btn">Accéder à la newsletter</a>
</div>
</body>
</html>`,
        {
          status: 400,
          headers: { 'Content-Type': 'text/html;charset=utf-8' },
        }
      );
    }

    const supabase = createAdminClient();

    const { data: subscription, error: findError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, email')
      .eq('unsubscribe_token', token)
      .single();

    if (findError || !subscription) {
      return new Response(
        `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Désabonnement — PROMOTE-CONNECT</title>
<style>
  body{margin:0;padding:32px 16px;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#172554}
  .card{max-width:480px;margin:40px auto;background:#fff;border-radius:28px;padding:40px 32px;text-align:center;box-shadow:0 20px 60px rgba(15,23,42,0.1)}
  h1{font-size:24px;margin:0 0 12px}
  p{color:#64748b;line-height:1.7;margin:0 0 24px;font-size:15px}
  .btn{display:inline-block;background:#912450;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px}
</style>
</head>
<body>
<div class="card">
  <h1>Lien invalide ou expiré</h1>
  <p>Ce lien de désabonnement n'est plus valide. Si vous êtes abonné, connectez-vous à votre espace pour gérer vos préférences.</p>
  <a href="/newsletter" class="btn">Accéder à la newsletter</a>
</div>
</body>
</html>`,
        {
          status: 404,
          headers: { 'Content-Type': 'text/html;charset=utf-8' },
        }
      );
    }

    await supabase
      .from('newsletter_subscriptions')
      .update({ is_active: false })
      .eq('id', subscription.id);

    return new Response(
      `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Désabonnement réussi — PROMOTE-CONNECT</title>
<style>
  body{margin:0;padding:32px 16px;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#172554}
  .card{max-width:480px;margin:40px auto;background:#fff;border-radius:28px;padding:40px 32px;text-align:center;box-shadow:0 20px 60px rgba(15,23,42,0.1)}
  .icon{width:56px;height:56px;background:#ecfdf5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:28px}
  h1{font-size:24px;margin:0 0 12px}
  p{color:#64748b;line-height:1.7;margin:0 0 8px;font-size:15px}
  .email{font-weight:600;color:#0f172a;font-size:15px;margin:0 0 24px}
  .btn{display:inline-block;background:#912450;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px;margin-top:8px}
</style>
</head>
<body>
<div class="card">
  <div class="icon">✓</div>
  <h1>Désabonnement réussi</h1>
  <p>Vous avez bien été désinscrit de la newsletter PROMOTE-CONNECT.</p>
  <p class="email">${escapeHtml(subscription.email)}</p>
  <p style="color:#94a3b8;font-size:13px">Vous pouvez vous réinscrire à tout moment depuis votre espace.</p>
  <a href="/newsletter" class="btn">Retour à la newsletter</a>
</div>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html;charset=utf-8' },
      }
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new Response(
      `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Erreur — PROMOTE-CONNECT</title>
<style>
  body{margin:0;padding:32px 16px;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#172554}
  .card{max-width:480px;margin:40px auto;background:#fff;border-radius:28px;padding:40px 32px;text-align:center;box-shadow:0 20px 60px rgba(15,23,42,0.1)}
  h1{font-size:24px;margin:0 0 12px}
  p{color:#64748b;line-height:1.7;margin:0 0 24px;font-size:15px}
  .btn{display:inline-block;background:#912450;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:600;font-size:14px}
</style>
</head>
<body>
<div class="card">
  <h1>Une erreur est survenue</h1>
  <p>Veuillez réessayer plus tard ou nous contacter via le support.</p>
  <a href="/support" class="btn">Contacter le support</a>
</div>
</body>
</html>`,
      {
        status: 500,
        headers: { 'Content-Type': 'text/html;charset=utf-8' },
      }
    );
  }
}
