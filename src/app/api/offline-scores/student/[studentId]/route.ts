// File: src/app/api/offline-scores/student/[studentId]/route.ts
import { NextResponse } from 'next/server';
import { getOfflineScoresForStudent as fetchOfflineScoresFromDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser } from '@/lib/types';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/offline-scores/student/[studentId]/route.ts');

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  const requestedStudentId = params.studentId; // Correctly access studentId from params
  console.log(`[API /api/offline-scores/student/:studentId] Received GET for studentId: ${requestedStudentId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/offline-scores/student/:studentId] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;

  // Teachers can fetch any student's offline scores.
  // Students can fetch their own if we decide to implement that view later.
  if (loggedInUser.role !== 'teacher' && loggedInUser.id !== requestedStudentId) {
    console.warn(`[API /api/offline-scores/student/:studentId] Forbidden access by user ${loggedInUser.id} for student ${requestedStudentId}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  if (!requestedStudentId) {
    console.error('[API /api/offline-scores/student/:studentId] Student ID is required');
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  try {
    const scores = await fetchOfflineScoresFromDb(requestedStudentId);
    console.log(`[API /api/offline-scores/student/:studentId] Fetched ${scores.length} offline scores for student ${requestedStudentId}`);
    return NextResponse.json(scores);
  } catch (error) {
    console.error(`[API /api/offline-scores/student/:studentId] Error fetching offline scores for ${requestedStudentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch offline scores', details: (error as Error).message }, { status: 500 });
  }
}
