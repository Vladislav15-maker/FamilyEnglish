// File: src/app/api/student/unit-grades/route.ts
import { NextResponse } from 'next/server';
import { getUnitGradesForStudent } from '@/lib/store';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { curriculum } from '@/lib/curriculum-data'; // To map unit names

export async function GET(request: Request) {
  console.log('[API /api/student/unit-grades] Received GET request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/student/unit-grades] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'student') {
    console.warn(`[API /api/student/unit-grades] Forbidden: User ${loggedInUser.username} is not a student.`);
    return NextResponse.json({ error: 'Forbidden: Only students can fetch their unit grades.' }, { status: 403 });
  }
  console.log(`[API /api/student/unit-grades] User authenticated as student: ${loggedInUser.username}`);

  try {
    const gradesFromDb = await getUnitGradesForStudent(loggedInUser.id);
    
    const gradesWithUnitNames = gradesFromDb.map(grade => {
      const unitDetails = curriculum.find(u => u.id === grade.unitId);
      return {
        ...grade,
        unitName: unitDetails ? unitDetails.name : 'Неизвестный юнит',
      };
    });

    console.log(`[API /api/student/unit-grades] Fetched and processed ${gradesWithUnitNames.length} unit grades for student ${loggedInUser.username}.`);
    return NextResponse.json(gradesWithUnitNames);
  } catch (error) {
    console.error(`[API /api/student/unit-grades] Error fetching unit grades for student ${loggedInUser.username}:`, error);
    return NextResponse.json({ error: 'Failed to fetch unit grades', details: (error as Error).message }, { status: 500 });
  }
}
