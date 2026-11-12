import { NextResponse, type NextRequest } from 'next/server';

// Runs before every request.
//
// 1. Host allowlist (ALLOWED_HOSTS). The panel has no login of its own and
//    relies on SWAG + Authelia, or on being bound to localhost. A malicious
//    website could otherwise use "DNS rebinding" to make your browser talk to
//    the panel under the attacker's domain name. Requests for any host name
//    not in the list are refused.
//
// 2. Cross-site request forgery (CSRF). Authelia signs you in with a cookie,
//    and browsers send it even on requests started by other websites. Every
//    request that changes something (save, reload) must carry the
//    X-LofiCraft header, which other sites can't add, and come from this site.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function allowedHosts(): Set<string> {
  const list = process.env.ALLOWED_HOSTS ?? 'localhost,127.0.0.1';
  return new Set(
    list
      .split(',')
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
  );
}

// "example.com:3000" -> "example.com", "[::1]:3000" -> "[::1]"
function hostname(host: string): string {
  const h = host.trim().toLowerCase();
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1);
  return h.split(':')[0];
}

function deny(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export function proxy(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  if (!allowedHosts().has(hostname(host))) {
    return deny(421, 'Host not allowed. Add it to ALLOWED_HOSTS in .env.');
  }

  if (req.nextUrl.pathname.startsWith('/api/') && !SAFE_METHODS.has(req.method)) {
    if (req.headers.get('x-loficraft') !== '1') {
      return deny(403, 'Cross-site request blocked');
    }
    const site = req.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin') {
      return deny(403, 'Cross-site request blocked');
    }
    const origin = req.headers.get('origin');
    if (origin) {
      let originHost = '';
      try {
        originHost = new URL(origin).host.toLowerCase();
      } catch {
        return deny(403, 'Cross-site request blocked');
      }
      if (originHost !== host.toLowerCase()) {
        return deny(403, 'Cross-site request blocked');
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
