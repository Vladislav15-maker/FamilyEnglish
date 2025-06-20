// File: src/app/api/student/class-overview/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import { getAllStudents, getAllStudentProgress } from '@/lib/store';
import type { AuthenticatedUser, User, StudentRoundProgress } from '@/lib/types';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/student/class-overview/route.ts');

export async function GET(request: Request) {
  console.log('[API /api/student/class-overview] Received GET request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/student/class-overview] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  // Allow both students and teachers to access this overview
  console.log(`[API /api/student/class-overview] User authenticated: ${loggedInUser.username} (Role: ${loggedInUser.role})`);

  try {
    const [studentsData, allProgressData] = await Promise.all([
      getAllStudents(), // Fetches all users with role 'student'
      getAllStudentProgress('') // Fetch all progress for all students
    ]);
    console.log(`[API /api/student/class-overview] Fetched ${studentsData.length} students and ${allProgressData.length} progress items.`);

    const studentsOverview = studentsData.map(student => {
      const studentProgressItems = allProgressData.filter(p => p.studentId === student.id);
      return {
        student,
        progress: studentProgressItems,
      };
    });
    console.log(`[API /api/student/class-overview] Successfully prepared class overview data.`);
    return NextResponse.json(studentsOverview);

  } catch (error) {
    console.error('[API /api/student/class-overview] Error fetching class overview data:', error);
    return NextResponse.json({ error: 'Failed to fetch class overview data', details: (error as Error).message }, { status: 500 });
  }
}

