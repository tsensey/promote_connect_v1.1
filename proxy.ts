import type { NextRequest } from 'next/server';
import { updateSession } from './lib/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sw.js|offline|icons|logo-promote.png|logo_transparent.png|PUBPROMOTE2026-1.webp|manifest.json|manifest.webmanifest|icon.svg|.well-known).*)",
  ],
};
