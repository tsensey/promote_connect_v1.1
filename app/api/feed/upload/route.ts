import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    const allFiles = files.length > 0 ? files : (singleFile ? [singleFile] : []);

    if (allFiles.length === 0) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of allFiles) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: `Le fichier ${file.name} depasse 5 Mo` }, { status: 400 });
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: `Format non supporte pour ${file.name}` }, { status: 400 });
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
        console.error("Storage upload error:", error);
        return NextResponse.json({ error: `Erreur upload: ${error.message}` }, { status: 500 });
      }

      const { data: urlData } = supabaseServer.storage
        .from('feed-images')
        .getPublicUrl(data.path);

      urls.push(urlData.publicUrl);
    }

    return NextResponse.json({ urls, url: urls[0] }); // url included for backwards compatibility
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur: ' + (err as Error).message }, { status: 500 });
  }
}
