// src/app/api/teacher/online-tests/results/[resultId]/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { gradeOnlineTestResult } from '@/lib/store';
import type { AuthenticatedUser } from '@/lib/types';
import * as z from 'zod';

const gradingSchema = z.object({
  isPassed: z.boolean(),
  grade: z.coerce.number().min(2).max(5),
  teacherNotes: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  const { resultId } = params;
  const session = await getAppSession();

  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = gradingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const gradedResult = await gradeOnlineTestResult(resultId, validation.data);

    return NextResponse.json(gradedResult);

  } catch (error) {
    console.error(`[API] Error grading online test result ${resultId}:`, error);
    return NextResponse.json({ error: 'Failed to grade test result', details: (error as Error).message }, { status: 500 });
  }
}