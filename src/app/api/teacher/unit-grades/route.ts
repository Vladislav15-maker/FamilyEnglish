// File: src/app/api/teacher/unit-grades/route.ts
import { NextResponse } from 'next/server';
import { addStudentUnitGrade, getAllUnitGradesByTeacher } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser, StudentUnitGrade } from '@/lib/types';
import * as z from 'zod';

const unitGradeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  unitId: z.string().min(1, "Unit ID is required"),
  grade: z.coerce.number().min(2).max(5, "Grade must be between 2 and 5"),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  console.log('[API /api/teacher/unit-grades] Received POST request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/teacher/unit-grades] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/teacher/unit-grades] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Only teachers can add unit grades.' }, { status: 403 });
  }
  console.log(`[API /api/teacher/unit-grades] User authenticated as teacher: ${loggedInUser.username}`);

  try {
    const body = await request.json();
    const validation = unitGradeSchema.safeParse(body);

    if (!validation.success) {
      console.warn('[API /api/teacher/unit-grades] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { studentId, unitId, grade, notes } = validation.data;

    const gradeData: Omit<StudentUnitGrade, 'id' | 'date' | 'teacherId'> = {
      studentId,
      unitId,
      grade: grade as 2 | 3 | 4 | 5,
      notes: notes || null,
    };
    
    console.log('[API /api/teacher/unit-grades] Prepared unit grade data for DB:', JSON.stringify(gradeData, null, 2));

    const newGrade = await addStudentUnitGrade(gradeData, loggedInUser.id);
    console.log(`[API /api/teacher/unit-grades] Unit grade added successfully for student ${studentId}, unit ${unitId}.`);
    return NextResponse.json(newGrade, { status: 201 });

  } catch (error) {
    console.error('[API /api/teacher/unit-grades] Error adding unit grade:', error);
    if (error instanceof SyntaxError) {
        console.error('[API /api/teacher/unit-grades] JSON parsing error from request body.');
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add unit grade', details: (error as Error).message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  console.log('[API /api/teacher/unit-grades] Received GET request for all unit grades by teacher.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/teacher/unit-grades] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/teacher/unit-grades] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }
  console.log(`[API /api/teacher/unit-grades] User authenticated as teacher: ${loggedInUser.username}`);

  try {
    const unitGrades = await getAllUnitGradesByTeacher(loggedInUser.id);
    console.log(`[API /api/teacher/unit-grades] Fetched ${unitGrades.length} unit grades for teacher ${loggedInUser.username}.`);
    return NextResponse.json(unitGrades);
  } catch (error) {
    console.error('[API /api/teacher/unit-grades] Error fetching unit grades for teacher:', error);
    return NextResponse.json({ error: 'Failed to fetch unit grades', details: (error as Error).message }, { status: 500 });
  }
}
