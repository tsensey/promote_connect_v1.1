import { supabaseClient } from '@/lib/supabase/client';

const ALLOWED_IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

export type AttachmentType = 'image' | 'document' | 'product';

export async function uploadChatFile(
  conversationId: string,
  file: File
): Promise<{ url: string; type: AttachmentType } | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type: AttachmentType = ALLOWED_IMAGE_EXTS.includes(ext) ? 'image' : 'document';

  const { data: session } = await supabaseClient.auth.getSession();
  const userId = session?.session?.user?.id;
  if (!userId) return null;

  const filePath = `${conversationId}/${userId}-${Date.now()}.${ext}`;
  const { data: uploadData, error: uploadError } = await supabaseClient.storage
    .from('chat_media')
    .upload(filePath, file, { upsert: false });

  if (uploadError || !uploadData) return null;

  const { data: urlData } = supabaseClient.storage
    .from('chat_media')
    .getPublicUrl(uploadData.path);

  return { url: urlData.publicUrl, type };
}
