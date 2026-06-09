import { createAdminClient } from '@/lib/supabase/admin';
import { Resend } from 'resend';
import { render } from '@react-email/components';
import CredentialsEmail from '@/emails/CredentialsEmail';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

function cleanEmails(raw: string | null): string[] {
  if (!raw) return [];
  // Sépare par virgule, point-virgule ou espace, et garde les emails valides
  return raw
    .split(/[,;\s]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

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
  
  const validEmails1 = cleanEmails(email1);
  const validEmails2 = cleanEmails(email2);
  const allEmails = Array.from(new Set([...validEmails1, ...validEmails2]));
  const authEmail = allEmails[0]; // On prend le premier email valide comme identifiant principal

  if (!authEmail) return { error: 'Aucun email valide pour la création du compte' };

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

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    full_name: fullName,
    role: 'exposant',
    subscription_tier: 'free_trial',
    account_status: 'active',
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

  if (!resend) {
    console.error('RESEND_API_KEY not configured — skipping email');
    return {
      account: {
        id: authData.user.id,
        email: authEmail,
        password,
        recipients: [],
      },
    };
  }

  const recipients: { email: string; sent: boolean; error?: string }[] = [];

  if (allEmails.length > 0) {
    try {
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
      const { error: sendError } = await resend.emails.send({
        from: FROM_EMAIL,
        to: allEmails,
        subject: 'Vos identifiants PROMOTE-CONNECT',
        html: emailHtml,
      });
      
      if (sendError) {
        console.error(`Resend send error:`, sendError);
        // ROLLBACK: On supprime le compte pour pouvoir réessayer plus tard
        await supabase.auth.admin.deleteUser(authData.user.id);
        return { error: `[email_failed] Erreur Resend: ${sendError.message}` };
      } else {
        allEmails.forEach(email => recipients.push({ email, sent: true }));
      }
    } catch (e) {
      console.error(`Resend exception:`, e);
      // ROLLBACK
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { error: `[email_failed] Exception Resend: ${String(e)}` };
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
