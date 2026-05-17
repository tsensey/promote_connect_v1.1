import DOMPurify from 'dompurify';

export function sanitizeHTML(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'ul', 'ol', 'li'], ALLOWED_ATTR: ['href', 'target', 'rel'] });
}

export function sanitizeText(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}
