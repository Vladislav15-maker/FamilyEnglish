// File: src/app/api/student/class-unit-grades/route.ts
import { NextResponse } from 'next/server';
import { getAllUnitGrades as fetchAllUnitGradesFromDb } from '@/lib/store'; // Using the new store function
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser, StudentUnitGrade } from '@/lib/types';
import { curriculum } from '@/lib/curriculum-data';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/student/class-unit-grades/route.ts');

export async function GET(request: Request) {
  console.log('[API /api/student/class-unit-grades] Received GET request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/student/class-unit-grades] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  console.log(`[API /api/student/class-unit-grades] User authenticated: ${loggedInUser.username} (Role: ${loggedInUser.role})`);

  try {
    const gradesFromDb = await fetchAllUnitGradesFromDb();
    
    // Enrich with unit names (studentName is already included from store function)
    const enrichedGrades = gradesFromDb.map(grade => {
        const unitInfo = curriculum.find(u => u.id === grade.unitId);
        return {
          ...grade,
          unitName: unitInfo ? unitInfo.name : grade.unitId, 
        };
      });

    console.log(`[API /api/student/class-unit-grades] Fetched ${enrichedGrades.length} unit grades for class view.`);
    return NextResponse.json(enrichedGrades);
  } catch (error) {
    console.error('[API /api/student/class-unit-grades] Error fetching unit grades for class view:', error);
    return NextResponse.json({ error: 'Failed to fetch unit grades for class view', details: (error as Error).message }, { status: 500 });
  }
}
