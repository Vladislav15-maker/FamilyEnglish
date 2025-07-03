// File: src/app/api/student/online-tests/submit/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { submitOnlineTestResult } from '@/lib/store';
import type { AuthenticatedUser } from '@/lib/types';
import * as z from 'zod';

const resultSchema = z.object({
  onlineTestId: z.string(),
  answers: z.array(z.object({
    wordId: z.string(),
    userAnswer: z.string(),
    // `correct` is no longer sent from the client
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

    const { onlineTestId, answers, durationSeconds } = validation.data;

    const resultData = {
      studentId: user.id,
      onlineTestId,
      answers, // These answers do not have the 'correct' field yet
      durationSeconds: durationSeconds ?? null,
    };
    
    const savedResult = await submitOnlineTestResult(resultData);
    
    return NextResponse.json(savedResult, { status: 201 });

  } catch (error) {
    console.error('[API /api/student/online-tests/submit] Error submitting test result:', error);
    return NextResponse.json({ error: 'Failed to submit test result', details: (error as Error).message }, { status: 500 });
  }
}
