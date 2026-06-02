import { createAdminClient } from '@/lib/supabase/admin';

export interface CreateAccountResult {
  account?: {
    id: string;
    email: string;
    password: string;
    recipients: { email: string; sent: boolean; error?: string }[];
  } | null;
  error?: string;
}

export async function createAccountForExposant(
  exposantId: string,
  email1: string | null,
  email2: string | null
): Promise<CreateAccountResult> {
  const supabase = createAdminClient();
  const authEmail = email1 || email2;
  if (!authEmail) return { account: null };

  const { data: exposant } = await supabase
    .from('exposants')
    .select('nom, pavillon, stand')
    .eq('id', exposantId)
    .single();

  if (!exposant) return { error: 'Exposant introuvable' };

  const password = crypto.randomUUID().slice(0, 12).replace(/-/g, '') + 'Ab1!';
  const fullName = exposant.nom;

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      temporary_password: true,
    },
  });

  if (authError || !authData.user) {
    return { error: authError?.message || 'Erreur création auth' };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    full_name: fullName,
    role: 'exposant',
    subscription_tier: 'free_trial',
    subscription_status: 'active',
    is_active: true,
  } as any);

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: `Erreur création profil: ${profileError.message}` };
  }

  const { error: linkError } = await supabase
    .from('exposants')
    .update({ profile_id: authData.user.id })
    .eq('id', exposantId);

  if (linkError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: `Erreur liaison: ${linkError.message}` };
  }

  const recipients: { email: string; sent: boolean; error?: string }[] = [];
  const targets = [email1, email2].filter(Boolean) as string[];
  const seen = new Set<string>();

  for (const recipientEmail of targets) {
    if (seen.has(recipientEmail)) continue;
    seen.add(recipientEmail);
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY || '');
      const { render } = await import('@react-email/components');
      const { default: CredentialsEmail } = await import('@/emails/CredentialsEmail');
      const emailHtml = await render(
        CredentialsEmail({
          fullName,
          email: authEmail,
          password,
          role: 'exposant',
          company: exposant.nom,
          pavillon: exposant.pavillon,
          stand: exposant.stand,
        })
      );
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
        to: [recipientEmail],
        subject: 'Vos identifiants PROMOTE-CONNECT',
        html: emailHtml,
      });
      recipients.push({ email: recipientEmail, sent: true });
    } catch (e) {
      recipients.push({ email: recipientEmail, sent: false, error: String(e) });
    }
  }

  return {
    account: {
      id: authData.user.id,
      email: authEmail,
      password,
      recipients,
    },
  };
}
