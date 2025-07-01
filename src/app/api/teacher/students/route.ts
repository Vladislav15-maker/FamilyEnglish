// File: src/app/api/teacher/students/route.ts
import { NextResponse } from 'next/server';
import { getAllStudents as fetchAllStudentsFromDb } from '@/lib/store';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';

export async function GET(request: Request) {
  console.log('[API /api/teacher/students] Received GET request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/teacher/students] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/teacher/students] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }
  console.log(`[API /api/teacher/students] User authenticated as teacher: ${loggedInUser.username}`);

  try {
    const students = await fetchAllStudentsFromDb();
    console.log(`[API /api/teacher/students] Fetched ${students.length} students.`);
    return NextResponse.json(students);
  } catch (error) {
    console.error('[API /api/teacher/students] Error fetching students:', error);
    return NextResponse.json({ error: 'Failed to fetch students', details: (error as Error).message }, { status: 500 });
  }
}
