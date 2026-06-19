import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, remaining } = await rateLimit(`event-upload:${ip}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  const sb = createAdminClient();
  const { data: { user }, error: authError } = await sb.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Le fichier ne doit pas dépasser 10 Mo" }, { status: 400 });
    }

    const allowedTypes = ["application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `events/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.pdf`;

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from("event-documents")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      return NextResponse.json({ error: `Erreur upload: ${error.message}` }, { status: 500 });
    }

    const { data: urlData } = adminClient.storage
      .from("event-documents")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl, fileName: file.name });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur: " + (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const token = authHeader.split("Bearer ")[1];
  const sb = createAdminClient();
  const { data: { user }, error: authError } = await sb.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL du fichier requise" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const path = url.split("/event-documents/")[1];
    if (!path) {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    const { error } = await adminClient.storage
      .from("event-documents")
      .remove([path]);

    if (error) {
      return NextResponse.json({ error: `Erreur suppression: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur: " + (err as Error).message }, { status: 500 });
  }
}
