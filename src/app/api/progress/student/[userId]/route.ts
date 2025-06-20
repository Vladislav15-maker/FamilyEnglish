// File: src/app/api/progress/student/[userId]/route.ts
import { NextResponse } from 'next/server';
import { getAllStudentProgress as fetchAllStudentProgressFromDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route'; 
import type { AuthenticatedUser } from '@/lib/types';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/progress/student/[userId]/route.ts');

export async function GET(
  request: Request,
  { params }: { params: { userId: string } } 
) {
  const requestedUserId = params.userId; // Correctly access userId from params
  console.log(`[API /api/progress/student/:userId] Received GET request for userId: ${requestedUserId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/progress/student/:userId] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  console.log(`[API /api/progress/student/:userId] Logged in user: ${loggedInUser.username}, Role: ${loggedInUser.role}, Requesting for: ${requestedUserId}`);

  // Students can only fetch their own progress. Teachers can fetch any student's.
  if (loggedInUser.role === 'student' && loggedInUser.id !== requestedUserId) {
    console.warn(`[API /api/progress/student/${requestedUserId}] Forbidden access attempt by student ${loggedInUser.id}`);
    return NextResponse.json({ error: 'Forbidden: You can only view your own progress.' }, { status: 403 });
  }

  if (!requestedUserId) {
    console.error('[API /api/progress/student/:userId] Error: User ID is required but was not found in params.');
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    console.log(`[API /api/progress/student/:userId] Attempting to fetch progress for user ID: ${requestedUserId}`);
    const progress = await fetchAllStudentProgressFromDb(requestedUserId);
    console.log(`[API /api/progress/student/:userId] Progress fetched for ${requestedUserId}:`, progress.length, "items");
    return NextResponse.json(progress);
  } catch (error) {
    console.error(`[API /api/progress/student/:userId] Error fetching progress for ${requestedUserId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch student progress', details: (error as Error).message }, { status: 500 });
  }
}
