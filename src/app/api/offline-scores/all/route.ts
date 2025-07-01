// File: src/app/api/offline-scores/all/route.ts
import { NextResponse } from 'next/server';
import { getAllOfflineScores as fetchAllOfflineScoresFromDb } from '@/lib/store';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';

export async function GET(request: Request) {
  console.log('[API /api/offline-scores/all] Received GET request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/offline-scores/all] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/offline-scores/all] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }
  console.log(`[API /api/offline-scores/all] User authenticated as teacher: ${loggedInUser.username}`);

  try {
    const scores = await fetchAllOfflineScoresFromDb();
    console.log(`[API /api/offline-scores/all] Fetched ${scores.length} offline scores.`);
    return NextResponse.json(scores);
  } catch (error) {
    console.error('[API /api/offline-scores/all] Error fetching all offline scores:', error);
    return NextResponse.json({ error: 'Failed to fetch all offline scores', details: (error as Error).message }, { status: 500 });
  }
}
