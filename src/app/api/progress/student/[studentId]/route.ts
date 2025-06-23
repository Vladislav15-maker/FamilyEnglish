// File: src/app/api/progress/student/[studentId]/route.ts
import { NextResponse } from 'next/server';
import { getAllStudentProgress as fetchAllStudentProgressFromDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route'; 
import type { AuthenticatedUser } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } } 
) {
  const { studentId } = params;
  console.log(`[API /api/progress/student/:studentId] Received GET request for studentId: ${studentId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/progress/student/:studentId] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  console.log(`[API /api/progress/student/:studentId] Logged in user: ${loggedInUser.username}, Role: ${loggedInUser.role}, Requesting for: ${studentId}`);

  // Students can only fetch their own progress. Teachers can fetch any student's.
  if (loggedInUser.role === 'student' && loggedInUser.id !== studentId) {
    console.warn(`[API /api/progress/student/${studentId}] Forbidden access attempt by student ${loggedInUser.id}`);
    return NextResponse.json({ error: 'Forbidden: You can only view your own progress.' }, { status: 403 });
  }

  if (!studentId) {
    console.error('[API /api/progress/student/:studentId] Error: Student ID is required but was not found in params.');
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  try {
    console.log(`[API /api/progress/student/:studentId] Attempting to fetch progress for user ID: ${studentId}`);
    const progress = await fetchAllStudentProgressFromDb(studentId);
    console.log(`[API /api/progress/student/:studentId] Progress fetched for ${studentId}:`, progress.length, "items");
    return NextResponse.json(progress);
  } catch (error) {
    console.error(`[API /api/progress/student/:studentId] Error fetching progress for ${studentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch student progress', details: (error as Error).message }, { status: 500 });
  }
}
