import type { NextRequest } from 'next/server';
import { updateSession } from './lib/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.svg|.*\\.ico|.*\\.json|.*\\.webmanifest|sw\\.js|offline|.well-known).*)",
  ],
};
