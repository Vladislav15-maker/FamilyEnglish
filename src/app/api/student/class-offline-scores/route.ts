// File: src/app/api/student/class-offline-scores/route.ts
import { NextResponse } from 'next/server';
import { getAllOfflineScores as fetchAllOfflineScoresFromDb } from '@/lib/store';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/student/class-offline-scores/route.ts');

export async function GET(request: Request) {
  console.log('[API /api/student/class-offline-scores] Received GET request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/student/class-offline-scores] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
    
  const loggedInUser = session.user as AuthenticatedUser;
  console.log(`[API /api/student/class-offline-scores] User authenticated: ${loggedInUser.username} (Role: ${loggedInUser.role})`);

  try {
    const scores = await fetchAllOfflineScoresFromDb();
    // studentName is already included from the store function
    console.log(`[API /api/student/class-offline-scores] Fetched ${scores.length} offline scores for class view.`);
    return NextResponse.json(scores);
  } catch (error) {
    console.error('[API /api/student/class-offline-scores] Error fetching all offline scores for class view:', error);
    return NextResponse.json({ error: 'Failed to fetch all offline scores for class view', details: (error as Error).message }, { status: 500 });
  }
}
