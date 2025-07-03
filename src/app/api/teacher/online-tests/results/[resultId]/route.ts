// src/app/api/teacher/online-tests/results/[resultId]/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { gradeOnlineTestResult, submitOnlineTestResult } from '@/lib/store';
import type { AuthenticatedUser, OnlineTestResultAnswer } from '@/lib/types';
import * as z from 'zod';

const gradingSchema = z.object({
  answers: z.array(z.object({
    wordId: z.string(),
    userAnswer: z.string(),
    correct: z.boolean(),
  })).optional(),
  score: z.coerce.number().min(0).max(100),
  isPassed: z.boolean(), // Teacher must decide
  grade: z.coerce.number().min(2).max(5),
  teacherNotes: z.string().optional(),
  onlineTestId: z.string().optional(), // Required only for unsubmitted tests
});

export async function PUT(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  let { resultId } = params;
  const session = await getAppSession();

  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = gradingSchema.safeParse(body);

    if (!validation.success) {
      console.log("[API] Grading validation failed:", validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const gradingPayload = validation.data;

    if (resultId.startsWith('unsubmitted-')) {
        const studentId = resultId.replace('unsubmitted-', '');
        const onlineTestId = gradingPayload.onlineTestId;

        if (!onlineTestId) {
            return NextResponse.json({ error: 'onlineTestId is required to grade an unsubmitted test' }, { status: 400 });
        }

        // Create a new submission record first
        const newResult = await submitOnlineTestResult({
            studentId,
            onlineTestId,
            answers: [], // Empty answers
            durationSeconds: 0
        });

        resultId = newResult.id; // Use the new, real ID for grading
    }

    const finalPayload = {
      score: gradingPayload.score,
      answers: gradingPayload.answers || [],
      isPassed: gradingPayload.isPassed,
      grade: gradingPayload.grade,
      teacherNotes: gradingPayload.teacherNotes || '',
    };
    
    const gradedResult = await gradeOnlineTestResult(resultId, finalPayload);

    return NextResponse.json(gradedResult);

  } catch (error) {
    console.error(`[API] Error grading online test result ${resultId}:`, error);
    return NextResponse.json({ error: 'Failed to grade test result', details: (error as Error).message }, { status: 500 });
  }
}
