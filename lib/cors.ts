import { NextRequest, NextResponse } from 'next/server';

export function addCorsHeaders(response: NextResponse, origin?: string) {
  // Allow requests from Flutter web dev server and production
  const allowedOrigins = [
    'http://localhost:61754',
    'http://localhost:3000',
    'http://127.0.0.1:61754',
    'http://127.0.0.1:3000',
  ];

  const requestOrigin = origin || '';
  const isAllowedOrigin = allowedOrigins.includes(requestOrigin) || requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1');

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', requestOrigin);
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

export function handleCorsOptions() {
  const response = new NextResponse(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}
