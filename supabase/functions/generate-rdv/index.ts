import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

interface GenerateRdvPayload {
  demandeur_id: string;
  destinataire_id: string;
  starts_at: string;
  ends_at: string;
  notes?: string;
}

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { demandeur_id, destinataire_id, starts_at, ends_at, notes } =
      (await req.json()) as GenerateRdvPayload;

    if (!demandeur_id || !destinataire_id || !starts_at || !ends_at) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

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
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", [demandeur_id, destinataire_id]);

    const demandeurProfile = profiles?.find((p) => p.id === demandeur_id);
    const destinataireProfile = profiles?.find((p) => p.id === destinataire_id);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey && demandeurProfile && destinataireProfile) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "PROMOTE-CONNECT <rdv@promote-connect.com>",
          to: [destinataireProfile.email],
          subject: `Nouvelle demande de rendez-vous de ${demandeurProfile.full_name}`,
          html: `
            <p>Bonjour ${destinataireProfile.full_name},</p>
            <p>${demandeurProfile.full_name} vous a envoyé une demande de rendez-vous sur PROMOTE-CONNECT.</p>
            <p>Début : ${new Date(starts_at).toLocaleString("fr-FR")}</p>
            <p>Fin : ${new Date(ends_at).toLocaleString("fr-FR")}</p>
            ${notes ? `<p>Note : ${notes}</p>` : ""}
            <p>Connectez-vous pour répondre.</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ id: data?.id, status: "created" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
