import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Le fichier ne doit pas depasser 5 Mo' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporte. Utilisez JPEG, PNG, WebP ou GIF' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const filePath = `posts/${fileName}`;

    const { data, error } = await supabaseServer.storage
      .from('feed-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '31536000',
      });

    if (error) {
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 });
    }

    const { data: urlData } = supabaseServer.storage
      .from('feed-images')
      .getPublicUrl(data.path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
