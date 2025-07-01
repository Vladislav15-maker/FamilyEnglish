// File: src/app/api/teacher/unit-grades/route.ts
import { NextResponse } from 'next/server';
import { addStudentUnitGrade, getAllUnitGradesByTeacher } from '@/lib/store';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser, StudentUnitGrade } from '@/lib/types';
import * as z from 'zod';
import { curriculum } from '@/lib/curriculum-data';

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
    console.log('[API /api/teacher/unit-grades] Request body:', body);
    const validation = unitGradeSchema.safeParse(body);

    if (!validation.success) {
      console.warn('[API /api/teacher/unit-grades] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: 'Validation error', message: 'Invalid data provided', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { studentId, unitId, grade, notes } = validation.data;

    const gradeDataForDb: Omit<StudentUnitGrade, 'id' | 'date' | 'teacherId' | 'studentName' | 'unitName'> = {
      studentId,
      unitId,
      grade: grade as 2 | 3 | 4 | 5,
      notes: notes || null,
    };
    
    console.log('[API /api/teacher/unit-grades] Prepared unit grade data for DB:', JSON.stringify(gradeDataForDb, null, 2));
    console.log(`[API /api/teacher/unit-grades] Calling addStudentUnitGrade with studentId: ${studentId}, unitId: ${unitId}, teacherId: ${loggedInUser.id}`);

    const newGrade = await addStudentUnitGrade(gradeDataForDb, loggedInUser.id);
    console.log(`[API /api/teacher/unit-grades] Unit grade added successfully for student ${studentId}, unit ${unitId}. New grade ID: ${newGrade.id}`);
    return NextResponse.json(newGrade, { status: 201 });

  } catch (error) {
    console.error('[API /api/teacher/unit-grades] Error adding unit grade:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    let statusCode = 500;
    let responseMessage = 'Failed to add unit grade.';
    let responseDetails: string | object | undefined = undefined;

    const anyError = error as any;

    if (anyError.code === 'POSTGRES_ERROR' && anyError.error) { // Vercel Postgres specific error structure
        responseMessage = anyError.error.message || responseMessage;
        responseDetails = anyError.error.detail || JSON.stringify(anyError.error);
        if (anyError.error.code === '23503') { // foreign_key_violation
            statusCode = 400;
            responseMessage = `Foreign key constraint violation: ${anyError.error.constraint || 'unknown constraint'}.`;
        } else if (anyError.error.code === '23505') { // unique_violation
            statusCode = 409;
            responseMessage = `Unique constraint violation: ${anyError.error.constraint || 'unknown constraint'}.`;
        } else if (anyError.error.code) {
           responseMessage = `Database error (${anyError.error.code}): ${responseMessage}`;
        }
    } else if (error instanceof SyntaxError) {
        statusCode = 400;
        responseMessage = 'Invalid JSON payload in request body.';
    } else if (error instanceof z.ZodError) {
        statusCode = 400;
        responseMessage = 'Validation error.';
        responseDetails = error.flatten().fieldErrors;
    } else if (error instanceof Error) {
        responseMessage = error.message;
    }

    return NextResponse.json({ 
        error: 'Failed to add unit grade', 
        message: responseMessage,
        details: responseDetails
    }, { status: statusCode });
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
    const unitGradesFromDb = await getAllUnitGradesByTeacher(loggedInUser.id);
    const enrichedGrades = unitGradesFromDb.map(grade => {
        const unitInfo = curriculum.find(u => u.id === grade.unitId);
        // studentName is already fetched in getAllUnitGradesByTeacher
        return {
          ...grade,
          unitName: unitInfo ? unitInfo.name : grade.unitId, 
        };
      });
    console.log(`[API /api/teacher/unit-grades] Fetched ${enrichedGrades.length} unit grades for teacher ${loggedInUser.username}.`);
    return NextResponse.json(enrichedGrades);
  } catch (error) {
    console.error('[API /api/teacher/unit-grades] Error fetching unit grades for teacher:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    const errorMessage = (error instanceof Error) ? error.message : 'Failed to fetch unit grades';
    return NextResponse.json({ error: 'Failed to fetch unit grades', message: errorMessage }, { status: 500 });
  }
}
