// File: src/app/api/progress/round/route.ts
import { NextResponse } from 'next/server';
import { saveStudentRoundProgress as saveProgressToDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { StudentRoundProgress, AuthenticatedUser } from '@/lib/types';

export async function POST(request: Request) {
  console.log('[API /api/progress/round] Received POST request.');
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/progress/round] Unauthorized: No session or user found.');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  console.log(`[API /api/progress/round] User authenticated: ${loggedInUser.username} (ID: ${loggedInUser.id}, Role: ${loggedInUser.role})`);
  
  try {
    const progressData = (await request.json()) as Omit<StudentRoundProgress, 'studentId' | 'timestamp' | 'attemptCount'> & { studentId?: string, timestamp?: number | string };
    console.log('[API /api/progress/round] Received progress data payload:', JSON.stringify(progressData, null, 2));

    const finalStudentId = loggedInUser.role === 'student' ? loggedInUser.id : progressData.studentId;

    if (!finalStudentId) {
        console.error('[API /api/progress/round] Error: Student ID is missing and cannot be determined from session or payload.');
        return NextResponse.json({ error: 'Student ID is missing and cannot be determined.' }, { status: 400 });
    }
    console.log(`[API /api/progress/round] Determined finalStudentId: ${finalStudentId}`);

    // The 'attemptCount' is handled by the database, so we omit it from the object passed to the store.
    const completeProgressData: Omit<StudentRoundProgress, 'attemptCount'> = {
      studentId: finalStudentId,
      unitId: progressData.unitId,
      roundId: progressData.roundId,
      score: Number(progressData.score),
      attempts: Array.isArray(progressData.attempts) ? progressData.attempts : [],
      completed: Boolean(progressData.completed),
      timestamp: progressData.timestamp ? new Date(progressData.timestamp).getTime() : Date.now(),
    };
    
    console.log('[API /api/progress/round] Prepared complete progress data for DB:', JSON.stringify(completeProgressData, null, 2));

    await saveProgressToDb(completeProgressData);
    console.log(`[API /api/progress/round] Progress saved successfully for student ${finalStudentId}, unit ${completeProgressData.unitId}, round ${completeProgressData.roundId}.`);
    return NextResponse.json({ message: 'Progress saved successfully' }, { status: 200 });

  } catch (error) {
    console.error('[API /api/progress/round] Error saving progress:', error);
    if (error instanceof SyntaxError) {
        console.error('[API /api/progress/round] JSON parsing error from request body.');
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save round progress', details: (error as Error).message }, { status: 500 });
  }
}
