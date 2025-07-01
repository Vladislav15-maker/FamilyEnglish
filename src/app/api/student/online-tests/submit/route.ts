// File: src/app/api/student/online-tests/submit/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { submitOnlineTestResult } from '@/lib/store';
import type { AuthenticatedUser, OnlineTestResult } from '@/lib/types';
import * as z from 'zod';

const resultSchema = z.object({
  onlineTestId: z.string(),
  score: z.number().min(0).max(100),
  answers: z.array(z.object({
    wordId: z.string(),
    userAnswer: z.string(),
    correct: z.boolean(),
  })),
  durationSeconds: z.number().int().optional(),
});

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const user = session.user as AuthenticatedUser;

  try {
    const body = await request.json();
    const validation = resultSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const resultData: Omit<OnlineTestResult, 'id' | 'completedAt' | 'isPassed' | 'grade' | 'teacherNotes'> = {
      studentId: user.id,
      ...validation.data,
      durationSeconds: validation.data.durationSeconds ?? null,
    };
    
    const savedResult = await submitOnlineTestResult(resultData);
    
    return NextResponse.json(savedResult, { status: 201 });

  } catch (error) {
    console.error('[API /api/student/online-tests/submit] Error submitting test result:', error);
    return NextResponse.json({ error: 'Failed to submit test result', details: (error as Error).message }, { status: 500 });
  }
}
