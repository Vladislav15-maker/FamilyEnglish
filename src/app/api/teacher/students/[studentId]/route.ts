// File: src/app/api/teacher/students/[studentId]/route.ts
import { NextResponse } from 'next/server';
import { findUserById } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser } from '@/lib/types';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/teacher/students/[studentId]/route.ts');

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  const requestedStudentId = params.studentId; // Correctly access studentId from params
  console.log(`[API /api/teacher/students/:studentId] Received GET for studentId: ${requestedStudentId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/teacher/students/:studentId] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/teacher/students/:studentId] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }

  if (!requestedStudentId) {
    console.error('[API /api/teacher/students/:studentId] Student ID is required.');
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
  }

  try {
    const student = await findUserById(requestedStudentId);
    if (!student || student.role !== 'student') {
      console.log(`[API /api/teacher/students/:studentId] Student not found or user is not a student: ${requestedStudentId}`);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }
    console.log(`[API /api/teacher/students/:studentId] Successfully fetched student: ${student.username}`);
    return NextResponse.json(student);
  } catch (error) {
    console.error(`[API /api/teacher/students/:studentId] Error fetching student ${requestedStudentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch student details', details: (error as Error).message }, { status: 500 });
  }
}
