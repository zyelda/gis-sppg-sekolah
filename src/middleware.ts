import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Ambil path URL yang sedang diakses user
  const path = request.nextUrl.pathname;

  // Cek apakah ada cookie tanda login (misalnya kita beri nama 'is_admin')
  const isAuthenticated = request.cookies.get('is_admin')?.value === 'true';

  // Skenario 1: User mencoba masuk /admin tapi BELUM login
  if (path.startsWith('/admin') && !isAuthenticated) {
    // Tendang balik ke halaman login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Skenario 2: User sudah login, tapi mencoba buka halaman /login lagi
  if (path === '/login' && isAuthenticated) {
    // Langsung arahkan masuk ke dashboard admin
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Jika aman, biarkan user melanjutkan
  return NextResponse.next();
}

// Konfigurasi route mana saja yang harus melewati middleware ini
export const config = {
  matcher: [
    '/admin/:path*', // Semua route yang berawalan /admin
    '/login'         // Halaman login itu sendiri
  ],
};