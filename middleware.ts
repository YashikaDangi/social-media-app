// Updated middleware.ts
import { verifyToken } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that require authentication
const protectedPaths = ['/dashboard'];

// Paths that should be accessible only to non-authenticated users
const authPaths = ['/auth/login', '/auth/register'];

// API paths - we'll make sure not to interfere with these
const apiPaths = ['/api/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes to avoid body consumption issues
  if (apiPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check for token in cookie or authorization header
  const token = request.cookies.get('token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  const isAuthenticated = token && verifyToken(token);
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && authPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Redirect unauthenticated users away from protected pages
  if (!isAuthenticated && protectedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}

// Update the matcher to exclude API routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    // Explicitly exclude API routes from middleware
    '/((?!api/).*)',
  ],
};