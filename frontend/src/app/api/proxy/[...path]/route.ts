import { NextRequest, NextResponse } from 'next/server';
import { getServerToken } from '@/lib/session';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:4000';

/**
 * BFF proxy: every client-side call to the backend goes through here so the JWT (stored in an
 * httpOnly cookie) is attached server-side and never exposed to client-side JS. Works for both
 * authenticated and guest (no cookie) requests — the backend's optionalAuthenticate handles the
 * absence of a token itself (SRS §6.2 guest mode).
 */
async function proxy(req: NextRequest, path: string[]) {
  const token = getServerToken();
  const targetUrl = `${API_BASE_URL}/${path.join('/')}${req.nextUrl.search}`;

  const isJsonBody = req.headers.get('content-type')?.includes('application/json');
  const init: RequestInit = {
    method: req.method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}),
    },
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (isJsonBody) {
      init.body = JSON.stringify(await req.json().catch(() => ({})));
    } else {
      // multipart/form-data (OCR upload) and other non-JSON bodies pass through as-is.
      init.body = req.body;
      // @ts-expect-error -- required by undici when streaming a body through fetch
      init.duplex = 'half';
      init.headers = { ...init.headers, ...(req.headers.get('content-type') ? { 'Content-Type': req.headers.get('content-type')! } : {}) };
    }
  }

  const backendRes = await fetch(targetUrl, init);
  const contentType = backendRes.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const data = await backendRes.json().catch(() => null);
    return NextResponse.json(data, { status: backendRes.status });
  }
  const text = await backendRes.text();
  return new NextResponse(text, { status: backendRes.status });
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return proxy(req, params.path);
}
