import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers to protect against common vulnerabilities
  response.headers.set('X-Content-Type-Options', 'nosniff') // Prevent MIME type sniffing
  response.headers.set('X-Frame-Options', 'DENY') // Prevent clickjacking
  response.headers.set('X-XSS-Protection', '1; mode=block') // Enable browser XSS protection
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains') // HSTS
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin') // Control referrer info
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()') // Disable APIs
  
  // Content Security Policy - restrict resources to same origin
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'"
  )

  return response
}

// Apply middleware to all routes except static files and API routes (which handle security separately)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
