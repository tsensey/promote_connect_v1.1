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

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function buildRdvEmailHtml(demandeurName: string, destinataireName: string, startsAt: string, endsAt: string, notes?: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#4A072B;padding:32px">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Nouvelle demande de rendez-vous</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:12px 16px;background:#f6f8fb;border-radius:12px;margin-bottom:16px">
                  <table role="presentation" width="100%">
                    <tr>
                      <td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding-bottom:4px">De</td>
                    </tr>
                    <tr>
                      <td style="font-size:15px;font-weight:600;color:#0f172a">${demandeurName}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f6f8fb;border-radius:12px;margin-bottom:16px">
                  <table role="presentation" width="100%">
                    <tr>
                      <td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding-bottom:4px">À</td>
                    </tr>
                    <tr>
                      <td style="font-size:15px;font-weight:600;color:#0f172a">${destinataireName}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f6f8fb;border-radius:12px;margin-bottom:16px">
                  <table role="presentation" width="100%">
                    <tr>
                      <td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding-bottom:4px">Début</td>
                    </tr>
                    <tr>
                      <td style="font-size:15px;font-weight:600;color:#0f172a">${formatDateTime(startsAt)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;background:#f6f8fb;border-radius:12px">
                  <table role="presentation" width="100%">
                    <tr>
                      <td style="font-size:11px;font-weight:600;text-transform:uppercase;color:#64748b;padding-bottom:4px">Fin</td>
                    </tr>
                    <tr>
                      <td style="font-size:15px;font-weight:600;color:#0f172a">${formatDateTime(endsAt)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            ${notes ? `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px">
              <tr>
                <td style="padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px">
                  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;text-transform:uppercase;color:#92400e">Note :</p>
                  <p style="margin:0;font-size:14px;color:#78350f">${notes}</p>
                </td>
              </tr>
            </table>` : ""}
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
            <p style="margin:0;font-size:14px;color:#64748b">Connectez-vous à PROMOTE-CONNECT pour confirmer ou refuser cette demande.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f6f8fb;padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">PROMOTE-CONNECT — Plateforme de networking professionnel</p>
            <p style="margin:4px 0 0;font-size:12px;color:#94a3b8">Conçu par <a href="https://bbit-it.com" style="color:#94a3b8">BBIT Sarl</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmail(resendApiKey: string, fromEmail: string, to: string, subject: string, html: string) {
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
  } else {
    console.log(`Email envoyé à ${to}: ${subject}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { demandeur_id, destinataire_id, starts_at, ends_at, notes } =
      (await req.json()) as GenerateRdvPayload;

    if (!demandeur_id || !destinataire_id || !starts_at || !ends_at) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: demandeurProfile, error: demandeurError } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_ends_at, full_name")
      .eq("id", demandeur_id)
      .single();

    if (demandeurError || !demandeurProfile) {
      return new Response(
        JSON.stringify({ error: "Profil introuvable" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const isPaid =
      demandeurProfile.subscription_tier === "paid" ||
      (demandeurProfile.subscription_ends_at &&
        new Date(demandeurProfile.subscription_ends_at) > new Date());

    if (!isPaid) {
      return new Response(
        JSON.stringify({ error: "L'abonnement PAID est requis pour créer un rendez-vous" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const { data: destinataireProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", destinataire_id)
      .single();

    const { data, error } = await supabase
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

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const rdvId = data?.id;

    // === Notification in-app immédiate ===
    try {
      await supabase.from("notifications").insert({
        profile_id: destinataire_id,
        sender_id: demandeur_id,
        type: "rdv_request",
        data: {
          rdv_id: rdvId,
          starts_at,
          ends_at,
          notes: notes || null,
          status: "pending",
        },
      });
    } catch (err) {
      console.error("Erreur insertion notification:", err);
    }

    // === Emails non bloquants ===
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "PROMOTE-CONNECT <rdv@promote-connect.com>";

    if (resendApiKey) {
      try {
        const { data: { user: demandeurUser } } = await supabase.auth.admin.getUserById(demandeur_id);
        const { data: { user: destinataireUser } } = await supabase.auth.admin.getUserById(destinataire_id);

        const demandeurName = demandeurProfile.full_name || "Un exposant";
        const destinataireName = destinataireProfile?.full_name || "Contact";
        const emailHtml = buildRdvEmailHtml(demandeurName, destinataireName, starts_at, ends_at, notes);

        if (destinataireUser?.email) {
          await sendEmail(
            resendApiKey, fromEmail,
            destinataireUser.email,
            `Nouvelle demande de rendez-vous de ${demandeurName}`,
            emailHtml,
          );
        }

        if (demandeurUser?.email) {
          await sendEmail(
            resendApiKey, fromEmail,
            demandeurUser.email,
            `Votre demande de rendez-vous avec ${destinataireName}`,
            emailHtml,
          );
        }
      } catch (err) {
        console.error("Erreur envoi email:", err);
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping emails");
    }

    return new Response(JSON.stringify({ id: rdvId, status: "created" }), {
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
