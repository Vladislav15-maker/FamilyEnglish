// File: src/app/api/progress/student/[studentId]/route.ts
import { NextResponse } from 'next/server';
import { getAllStudentProgress as fetchAllStudentProgressFromDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route'; 
import type { AuthenticatedUser } from '@/lib/types';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/progress/student/[studentId]/route.ts');

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } } 
) {
  const requestedStudentId = params.studentId;
  console.log(`[API /api/progress/student/:studentId] Received GET request for studentId: ${requestedStudentId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/progress/student/:studentId] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  console.log(`[API /api/progress/student/:studentId] Logged in user: ${loggedInUser.username}, Role: ${loggedInUser.role}, Requesting for: ${requestedStudentId}`);

  // Students can only fetch their own progress. Teachers can fetch any student's.
  if (loggedInUser.role === 'student' && loggedInUser.id !== requestedStudentId) {
    console.warn(`[API /api/progress/student/${requestedStudentId}] Forbidden access attempt by student ${loggedInUser.id}`);
    return NextResponse.json({ error: 'Forbidden: You can only view your own progress.' }, { status: 403 });
  }

  if (!requestedStudentId) {
    console.error('[API /api/progress/student/:studentId] Error: Student ID is required but was not found in params.');
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  try {
    console.log(`[API /api/progress/student/:studentId] Attempting to fetch progress for user ID: ${requestedStudentId}`);
    const progress = await fetchAllStudentProgressFromDb(requestedStudentId);
    console.log(`[API /api/progress/student/:studentId] Progress fetched for ${requestedStudentId}:`, progress.length, "items");
    return NextResponse.json(progress);
  } catch (error) {
    console.error(`[API /api/progress/student/:studentId] Error fetching progress for ${requestedStudentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch student progress', details: (error as Error).message }, { status: 500 });
  }
}
