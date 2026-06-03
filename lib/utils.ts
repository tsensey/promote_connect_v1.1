import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toEmbedUrl(url?: string | undefined): string | undefined {
  if (!url) return undefined;

  if (url.includes("youtube.com/watch") || url.includes("youtu.be")) {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }

  if (url.includes("vimeo.com") && !url.includes("player.vimeo.com")) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match) return `https://player.vimeo.com/video/${match[1]}`;
  }

  return url;
}

export function safeBtoa(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    ));
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

export function getValidImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  return `/${url}`;
}
