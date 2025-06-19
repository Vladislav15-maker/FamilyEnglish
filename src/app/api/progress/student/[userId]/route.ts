// File: src/app/api/progress/student/[userId]/route.ts
import { NextResponse } from 'next/server';
import { getAllStudentProgress as fetchAllStudentProgressFromDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getAppSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  const { userId: requestedUserId } = params; // Correctly destructure userId

  // Students can only fetch their own progress. Teachers can fetch any student's.
  if (loggedInUser.role === 'student' && loggedInUser.id !== requestedUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!requestedUserId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // console.log(`[API /api/progress/student/${requestedUserId}] Attempting to fetch progress.`);
    // console.log(`[API /api/progress/student/${requestedUserId}] POSTGRES_URL check in API route:`, process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
    const progress = await fetchAllStudentProgressFromDb(requestedUserId);
    // console.log(`[API /api/progress/student/${requestedUserId}] Progress fetched:`, progress.length, "items");
    return NextResponse.json(progress);
  } catch (error) {
    console.error(`[API /api/progress/student/${requestedUserId}] Error fetching progress:`, error);
    return NextResponse.json({ error: 'Failed to fetch student progress' }, { status: 500 });
  }
}
