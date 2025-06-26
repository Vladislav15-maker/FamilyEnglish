// File: src/app/api/offline-scores/route.ts
import { NextResponse } from 'next/server';
import { addOfflineScore as addOfflineScoreToDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser, OfflineTestScore } from '@/lib/types';
import * as z from 'zod';

const offlineScoreSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  testId: z.string().min(1, "Test ID is required"),
  score: z.coerce.number().min(2).max(5, "Score must be between 2 and 5"),
  notes: z.string().optional(),
  passed: z.boolean(),
});

export async function POST(request: Request) {
  console.log('[API /api/offline-scores] Received POST request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/offline-scores] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/offline-scores] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Only teachers can add offline scores.' }, { status: 403 });
  }
  console.log(`[API /api/offline-scores] User authenticated as teacher: ${loggedInUser.username}`);

  try {
    const body = await request.json();
    const validation = offlineScoreSchema.safeParse(body);

    if (!validation.success) {
      console.warn('[API /api/offline-scores] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { studentId, score, notes, passed, testId } = validation.data;

    const scoreData: Omit<OfflineTestScore, 'id' | 'date' | 'studentName' | 'testName'> = {
      studentId,
      teacherId: loggedInUser.id, // Teacher is the one making the request
      score: score as 2 | 3 | 4 | 5,
      notes: notes || null,
      passed,
      testId,
    };
    
    console.log('[API /api/offline-scores] Prepared score data for DB:', JSON.stringify(scoreData, null, 2));

    const newScore = await addOfflineScoreToDb(scoreData);
    console.log(`[API /api/offline-scores] Offline score added successfully for student ${studentId}.`);
    return NextResponse.json(newScore, { status: 201 });

  } catch (error) {
    console.error('[API /api/offline-scores] Error adding offline score:', error);
    if (error instanceof SyntaxError) {
        console.error('[API /api/offline-scores] JSON parsing error from request body.');
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to add offline score', details: (error as Error).message }, { status: 500 });
  }
}
