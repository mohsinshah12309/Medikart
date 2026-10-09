import { NextResponse } from 'next/server';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const INTERNAL_API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1f: Canonical host redirect (www -> non-www) in production
  if (host.startsWith('www.medikart.pk')) {
    const url = request.nextUrl.clone();
    url.host = 'medikart.pk';
    url.protocol = 'https:';
    return NextResponse.redirect(url, 308);
  }

  // 1a: Redirect /?category=x pattern to /categories/[slug]
  if (pathname === '/' && searchParams.has('category')) {
    const category = searchParams.get('category');
    if (category) {
      const url = new URL(`/categories/${encodeURIComponent(category)}`, request.url);
      return NextResponse.redirect(url, 308);
    }
  }

  // 1b: 301/308 Permanent redirect for old /products/[id] to /products/[slug]
  if (pathname.startsWith('/products/')) {
    const parts = pathname.split('/');
    const identifier = parts[2];
    if (identifier && OBJECT_ID_REGEX.test(identifier)) {
      try {
        const res = await fetch(`${INTERNAL_API}/products/${identifier}`, {
          headers: { 'Content-Type': 'application/json' },
          next: { revalidate: 3600 },
        });
        if (res.ok) {
          const data = await res.json();
          const slug = data?.data?.product?.slug;
          if (slug && slug !== identifier) {
            const redirectUrl = new URL(`/products/${slug}`, request.url);
            return NextResponse.redirect(redirectUrl, 308);
          }
        }
      } catch (_) {
        // Fallback to normal routing if upstream API is unreachable
      }
    }
  }

  // Purge /press route redirect to homepage
  if (pathname === '/press' || pathname.startsWith('/press/')) {
    return NextResponse.redirect(new URL('/', request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, uploads (static assets)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|uploads).*)',
  ],
};
