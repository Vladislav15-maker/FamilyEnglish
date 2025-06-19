// File: src/app/api/teacher/students-overview/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import { getAllStudents, getAllStudentProgress } from '@/lib/store';
import type { AuthenticatedUser, User, StudentRoundProgress } from '@/lib/types';

export async function GET(request: Request) {
  console.log('[API /api/teacher/students-overview] Received GET request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/teacher/students-overview] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/teacher/students-overview] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }
  console.log(`[API /api/teacher/students-overview] User authenticated as teacher: ${loggedInUser.username}`);

  try {
    const [studentsData, allProgressData] = await Promise.all([
      getAllStudents(),
      getAllStudentProgress('') // Fetch all progress for all students
    ]);
    console.log(`[API /api/teacher/students-overview] Fetched ${studentsData.length} students and ${allProgressData.length} progress items.`);

    // Combine student data with their respective progress
    const studentsOverview = studentsData.map(student => {
      const studentProgressItems = allProgressData.filter(p => p.studentId === student.id);
      return {
        student,
        progress: studentProgressItems,
      };
    });
    console.log(`[API /api/teacher/students-overview] Successfully prepared students overview data.`);
    return NextResponse.json(studentsOverview);

  } catch (error) {
    console.error('[API /api/teacher/students-overview] Error fetching students overview data:', error);
    return NextResponse.json({ error: 'Failed to fetch students overview data', details: (error as Error).message }, { status: 500 });
  }
}
