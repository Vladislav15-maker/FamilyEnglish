// src/app/api/teacher/students/[studentId]/online-test-results/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { getStudentOnlineTestResults } from '@/lib/store';
import type { AuthenticatedUser } from '@/lib/types';

export async function GET(
  request: Request,
  { params }: { params: { studentId: string } }
) {
  const { studentId } = params;
  const session = await getAppSession();

  // Ensure user is logged in and is a teacher
  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const results = await getStudentOnlineTestResults(studentId);
    return NextResponse.json(results);
  } catch (error) {
    console.error(`[API] Error fetching online test results for student ${studentId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch test results', details: (error as Error).message }, { status: 500 });
  }
}
