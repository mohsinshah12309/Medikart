import { submitToIndexNow, INDEXNOW_KEY, KEY_LOCATION } from '../../../lib/indexnow.js';
import { getAllPriorityLandingSlugs } from '../../../data/priorityLandingPagesData.js';
import { FALLBACK_CATEGORIES } from '../../../lib/sitemap-utils.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  const expectedSecret = process.env.REVALIDATION_SECRET || 'b3f2a1e7d94c8b0f6e52a3d1c7f4b8e0a5d2c9f6b1e4a7d0c3f8b5e2a9d6c3f0';

  if (secret && secret !== expectedSecret) {
    return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  }

  // Build top priority URLs list for instant index ping
  const priorityUrls = [
    'https://medikart.pk/',
    'https://medikart.pk/instant-order',
    'https://medikart.pk/refill',
    'https://medikart.pk/blogs',
    'https://medikart.pk/brands',
    'https://medikart.pk/faqs',
  ];

  FALLBACK_CATEGORIES.forEach(cat => {
    priorityUrls.push(`https://medikart.pk/categories/${cat.slug}`);
  });

  const priorityBrandSlugs = getAllPriorityLandingSlugs();
  priorityBrandSlugs.forEach(slug => {
    priorityUrls.push(`https://medikart.pk/brands/${slug}`);
  });

  const result = await submitToIndexNow(priorityUrls);

  return Response.json({
    status: result.success ? 'success' : 'partial',
    key: INDEXNOW_KEY,
    keyLocation: KEY_LOCATION,
    submittedCount: result.submittedCount,
    details: result.results,
  });
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    const expectedSecret = process.env.REVALIDATION_SECRET || 'b3f2a1e7d94c8b0f6e52a3d1c7f4b8e0a5d2c9f6b1e4a7d0c3f8b5e2a9d6c3f0';

    if (authHeader && authHeader !== `Bearer ${expectedSecret}`) {
      return Response.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const urls = body.urls || (body.url ? [body.url] : []);

    if (!urls || urls.length === 0) {
      return Response.json({ status: 'error', message: 'No URLs specified in request body.' }, { status: 400 });
    }

    const result = await submitToIndexNow(urls);

    return Response.json({
      status: result.success ? 'success' : 'error',
      keyLocation: KEY_LOCATION,
      submittedCount: result.submittedCount,
      details: result.results,
    });
  } catch (err) {
    return Response.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
