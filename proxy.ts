import type { NextRequest } from 'next/server';
import { updateSession } from './lib/middleware';

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/', '/login', '/register', '/app/:path*', '/admin/:path*', '/exposant/:path*'],
};
