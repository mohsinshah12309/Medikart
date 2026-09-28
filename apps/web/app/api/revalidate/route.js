import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * On-Demand ISR Revalidation Endpoint
 * POST /api/revalidate
 * Authenticated via secret token
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, paths = [], tags = [] } = body;
    const expectedSecret =
      process.env.REVALIDATION_SECRET ||
      process.env.JWT_SECRET ||
      'medikart-revalidation-secret';

    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid revalidation token' },
        { status: 401 }
      );
    }

    const revalidated = [];

    if (Array.isArray(paths)) {
      for (const p of paths) {
        if (p && typeof p === 'string') {
          try {
            revalidatePath(p);
            revalidated.push(`path:${p}`);
          } catch (e) {
            console.error(`Failed to revalidate path ${p}:`, e.message);
          }
        }
      }
    }

    if (Array.isArray(tags)) {
      for (const t of tags) {
        if (t && typeof t === 'string') {
          try {
            revalidateTag(t);
            revalidated.push(`tag:${t}`);
          } catch (e) {
            console.error(`Failed to revalidate tag ${t}:`, e.message);
          }
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      revalidated,
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', message: err.message || 'Revalidation failed' },
      { status: 500 }
    );
  }
}
