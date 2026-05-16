export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatRelativeTime(
  dateStr: string | null | undefined,
  t: (key: string) => string
): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return t('chat.now');
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay === 1) return t('chat.yesterday');
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export function isSameDay(a: string, b: string): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function getMessagePreview(
  msg: { content: string; attachment_type: string | null; product_attachment: unknown } | null
): string {
  if (!msg) return '';
  let preview = msg.content;
  if (!preview && msg.attachment_type === 'image') preview = '📷 Photo';
  else if (!preview && msg.attachment_type === 'document') preview = '📄 Document';
  else if (msg.product_attachment) {
    const product = msg.product_attachment as { nom: string } | null;
    preview = `🏷️ ${product?.nom || 'Produit'}`;
  }
  return preview || '';
}
