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
  // Preflight CORS
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

    // Vérifier que le demandeur est PAID
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

    // Récupérer le profil destinataire
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

    // Email non bloquant — ne pas faire échouer la création du RDV
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && demandeurProfile) {
      const { data: { user: demandeurUser } } = await supabase.auth.admin.getUserById(demandeur_id);
      const { data: { user: destinataireUser } } = await supabase.auth.admin.getUserById(destinataire_id);
      const destinataireEmail = destinataireUser?.email;

      if (destinataireEmail) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: "PROMOTE-CONNECT <rdv@promote-connect.com>",
              to: [destinataireEmail],
              subject: `Nouvelle demande de rendez-vous de ${demandeurProfile.full_name}`,
              html: `
                <p>Bonjour ${destinataireProfile?.full_name},</p>
                <p>${demandeurProfile.full_name} vous a envoyé une demande de rendez-vous sur PROMOTE-CONNECT.</p>
                <p>Début : ${new Date(starts_at).toLocaleString("fr-FR")}</p>
                <p>Fin : ${new Date(ends_at).toLocaleString("fr-FR")}</p>
                ${notes ? `<p>Note : ${notes}</p>` : ""}
                <p>Connectez-vous pour répondre.</p>
              `,
            }),
          });
        } catch {
          // Échec d'envoi d'email non critique — le RDV a déjà été créé
        }
      }
    }

    return new Response(JSON.stringify({ id: data?.id, status: "created" }), {
      status: 201,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
