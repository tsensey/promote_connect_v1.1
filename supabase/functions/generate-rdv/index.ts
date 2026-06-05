import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRdvPayload {
  demandeur_id: string;
  destinataire_id: string;
  starts_at: string;
  ends_at: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Non authentifié" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
    const jwt = authHeader.replace("Bearer ", "");

    const authClient = createClient(supabaseUrl, jwt, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Token invalide" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { demandeur_id, destinataire_id, starts_at, ends_at, notes } =
      (await req.json()) as GenerateRdvPayload;

    if (!demandeur_id || !destinataire_id || !starts_at || !ends_at) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return new Response(
        JSON.stringify({ error: "Format de date invalide" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (startDate < today) {
      return new Response(
        JSON.stringify({ error: "La date du RDV ne peut pas être dans le passé" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (startDate.getFullYear() > currentYear) {
      return new Response(
        JSON.stringify({ error: "Le RDV ne peut pas dépasser l'année courante" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (endDate <= startDate) {
      return new Response(
        JSON.stringify({ error: "La date de fin doit être après la date de début" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    if (user.id !== demandeur_id) {
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: collision, count: collisionCount } = await adminClient
      .from("rendez_vous")
      .select("id", { count: "exact", head: true })
      .or(`demandeur_id.eq.${demandeur_id},destinataire_id.eq.${demandeur_id}`)
      .or(`demandeur_id.eq.${destinataire_id},destinataire_id.eq.${destinataire_id}`)
      .neq("status", "cancelled")
      .lt("starts_at", ends_at)
      .gt("ends_at", starts_at);

    if (collision && collisionCount && collisionCount > 0) {
      return new Response(
        JSON.stringify({ error: "Créneau déjà occupé" }),
        { status: 409, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: rdv, error: rdvError } = await authClient
      .from("rendez_vous")
      .insert({
        demandeur_id,
        destinataire_id,
        starts_at,
        ends_at,
        notes: notes || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (rdvError) {
      if (rdvError.code === "42501") {
        return new Response(
          JSON.stringify({ error: "L'abonnement PAID est requis pour créer un rendez-vous" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
      return new Response(JSON.stringify({ error: rdvError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const rdvId = rdv?.id;

    const { data: demandeurProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", demandeur_id)
      .single();

    const { data: destinataireProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", destinataire_id)
      .single();

    const demandeurName = demandeurProfile?.full_name || "Un exposant";
    const destinataireName = destinataireProfile?.full_name || "Contact";

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "newsletter@promote-connect.com";
    const sent = { destinataire: false, demandeur: false };

    if (resendApiKey) {
      try {
        const { data: { user: demandeurUser } } = await adminClient.auth.admin.getUserById(demandeur_id);
        const { data: { user: destinataireUser } } = await adminClient.auth.admin.getUserById(destinataire_id);

        const baseUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://promote-connect.pro";
        const agendaUrl = `${baseUrl}/agenda`;

        if (destinataireUser?.email) {
          sent.destinataire = await sendEmail(
            resendApiKey, fromEmail,
            destinataireUser.email,
            `Nouvelle demande de rendez-vous de ${demandeurName}`,
            buildEmailHtml(demandeurName, destinataireName, starts_at, ends_at, notes, "pending", baseUrl, agendaUrl),
          );
        }

        if (demandeurUser?.email) {
          sent.demandeur = await sendEmail(
            resendApiKey, fromEmail,
            demandeurUser.email,
            `Votre demande de rendez-vous avec ${destinataireName}`,
            buildEmailHtml(demandeurName, destinataireName, starts_at, ends_at, notes, "pending", baseUrl, agendaUrl),
          );
        }
      } catch (err) {
        console.error("Erreur envoi email:", err);
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping emails");
    }

    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    if (fcmServerKey) {
      try {
        const { data: fcmTokens } = await adminClient
          .from("profiles")
          .select("id, fcm_token")
          .in("id", [demandeur_id, destinataire_id])
          .not("fcm_token", "is", null);

        if (fcmTokens) {
          const baseUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://promote-connect.pro";
          const agendaUrl = `${baseUrl}/agenda`;
          for (const p of fcmTokens) {
            if (!p.fcm_token) continue;
            const isDestinataire = p.id === destinataire_id;
            try {
              await sendFcmNotification(
                fcmServerKey,
                p.fcm_token,
                isDestinataire ? "Nouvelle demande de RDV" : "Demande de RDV envoyée",
                isDestinataire
                  ? `${demandeurName} vous a envoyé une demande de rendez-vous`
                  : `Votre demande de rendez-vous avec ${destinataireName} a bien été envoyée`,
                agendaUrl,
              );
            } catch (err) {
              console.error("Erreur FCM push:", err);
            }
          }
        }
      } catch (err) {
        console.error("Erreur récupération tokens FCM:", err);
      }
    }

    return new Response(JSON.stringify({ id: rdvId, status: "created", email_sent: sent }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("Erreur generate-rdv function:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function buildEmailHtml(
  demandeurName: string, destinataireName: string,
  startsAt: string, endsAt: string,
  notes: string | undefined,
  status: string,
  baseUrl: string,
  agendaUrl: string,
) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Nouvelle demande de rendez-vous", color: "#f59e0b" },
    confirmed: { label: "Rendez-vous confirmé", color: "#22c55e" },
    cancelled: { label: "Rendez-vous annulé", color: "#ef4444" },
  };
  const cfg = statusConfig[status] || statusConfig.pending;

  const notesHtml = notes
    ? `<div style="margin-bottom:20px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;color:#92400e">Note :</p>
      <p style="margin:0;font-size:14px;color:#78350f;line-height:1.5">${notes}</p>
    </div>`
    : "";

  const detailHtml = `
    <div style="margin-bottom:16px;padding:12px 16px;background:#f6f8fb;border-radius:12px;display:inline-block">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${cfg.color};vertical-align:middle;margin-right:8px"></span>
      <span style="font-size:13px;font-weight:600;color:${cfg.color}">${cfg.label}</span>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background:#f6f8fb;border-radius:12px">
      <tr><td style="padding:16px">
        <table width="100%">
          <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">De</td></tr>
          <tr><td style="font-size:15px;font-weight:600;color:#0f172a;padding:0 0 16px">${demandeurName}</td></tr>
          <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">À</td></tr>
          <tr><td style="font-size:15px;font-weight:600;color:#0f172a;padding:0 0 16px">${destinataireName}</td></tr>
          <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">Début</td></tr>
          <tr><td style="font-size:15px;font-weight:600;color:#0f172a;padding:0 0 16px">${formatDateTime(startsAt)}</td></tr>
          <tr><td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding:0 0 4px">Fin</td></tr>
          <tr><td style="font-size:15px;font-weight:600;color:#0f172a">${formatDateTime(endsAt)}</td></tr>
        </table>
      </td></tr>
    </table>`;

  const footerMessage = status === "pending" ? "Connectez-vous à PROMOTE-CONNECT pour confirmer ou refuser cette demande." :
    status === "confirmed" ? "Ce rendez-vous est confirmé. Vous recevrez un rappel avant l'événement." :
    status === "cancelled" ? "Ce rendez-vous a été annulé." : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${cfg.label}</title></head>
<body style="margin:0;padding:32px 16px;background:#f6f8fb;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
<div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0">
  <div style="background:#4A072B;padding:32px">
    <img src="${baseUrl}/pro_connect_fr.webp" width="180" height="auto" alt="PROMOTE-CONNECT" style="display:block;border:0;margin-bottom:16px" />
    <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;line-height:1.3">${cfg.label}</h1>
  </div>
  <div style="padding:32px">
    ${detailHtml}
    ${notesHtml}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.6">${footerMessage}</p>
    <p style="margin:0;text-align:center">
      <a href="${agendaUrl}" style="display:inline-block;padding:12px 24px;background:#4A072B;color:#ffffff;text-decoration:none;border-radius:12px;font-size:14px;font-weight:600">Voir mon agenda</a>
    </p>
  </div>
  <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
    <p style="margin:0;font-size:12px;color:#94a3b8">PROMOTE-CONNECT — Plateforme de networking professionnel</p>
    <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">&copy; ${new Date().getFullYear()} PROMOTE. Tous droits réservés.</p>
    <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Conçu par <a href="https://bbit-it.com" style="color:#94a3b8;text-decoration:underline">BBIT Sarl</a></p>
  </div>
</div>
</body>
</html>`;
}

async function sendFcmNotification(fcmServerKey: string, token: string, title: string, body: string, url: string): Promise<boolean> {
  try {
    const res = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `key=${fcmServerKey}` },
      body: JSON.stringify({
        to: token,
        notification: { title, body, icon: "/icons/icon-192x192.png" },
        data: { url, click_action: "FLUTTER_NOTIFICATION_CLICK" },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("Erreur FCM:", err);
    return false;
  }
}

async function sendEmail(resendApiKey: string, fromEmail: string, to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({ from: fromEmail, to: [to], subject, html }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Resend API error (${res.status}): ${text}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Erreur envoi email Resend:", err);
    return false;
  }
}
