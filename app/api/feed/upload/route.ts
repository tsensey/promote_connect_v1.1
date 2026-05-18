import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, remaining } = rateLimit(`upload:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } },
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    const sb = createAdminClient();
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
  } else {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

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

      const isGif = file.type === 'image/gif';
      const originalBuffer = Buffer.from(await file.arrayBuffer());
      const buffer = !isGif
        ? await sharp(originalBuffer)
            .resize(2048, 2048, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85, mozjpeg: true })
            .toBuffer()
        : originalBuffer;
      const ext = isGif ? 'gif' : 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
      const filePath = `posts/${fileName}`;

      const adminClient = createAdminClient();
      const { data, error } = await adminClient.storage
        .from('feed-images')
        .upload(filePath, buffer, {
          contentType: isGif ? file.type : 'image/jpeg',
          cacheControl: '31536000',
        });

      if (error) {
        console.error("Storage upload error:", error);
        return NextResponse.json({ error: `Erreur upload: ${error.message}` }, { status: 500 });
      }

      const { data: urlData } = adminClient.storage
        .from('feed-images')
        .getPublicUrl(data.path);

      urls.push(urlData.publicUrl);
    }

    return NextResponse.json({ urls, url: urls[0] }); // url included for backwards compatibility
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur: ' + (err as Error).message }, { status: 500 });
  }
}
