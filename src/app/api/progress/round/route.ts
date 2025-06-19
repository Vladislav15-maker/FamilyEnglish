// File: src/app/api/progress/round/route.ts
import { NextResponse } from 'next/server';
import { saveStudentRoundProgress as saveProgressToDb } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { StudentRoundProgress, AuthenticatedUser } from '@/lib/types';

export async function POST(request: Request) {
  const session = await getAppSession();

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  
  try {
    const progressData = (await request.json()) as Omit<StudentRoundProgress, 'studentId' | 'timestamp'> & { studentId?: string, timestamp?: number | string };

    // Ensure the studentId in the payload matches the logged-in user if the user is a student
    // Teachers might theoretically save progress for others, but current app flow is student-centric for this action.
    if (loggedInUser.role === 'student' && progressData.studentId && loggedInUser.id !== progressData.studentId) {
      return NextResponse.json({ error: 'Forbidden: You can only save your own progress.' }, { status: 403 });
    }
    
    // If studentId is not in payload (e.g. client assumes server knows), set it from session for students.
    const finalStudentId = loggedInUser.role === 'student' ? loggedInUser.id : progressData.studentId;

    if (!finalStudentId) {
        return NextResponse.json({ error: 'Student ID is missing and cannot be determined.' }, { status: 400 });
    }

    const completeProgressData: StudentRoundProgress = {
      ...progressData,
      studentId: finalStudentId,
      timestamp: progressData.timestamp ? new Date(progressData.timestamp).getTime() : Date.now(),
      // Ensure score is a number. Client should send it as number.
      score: Number(progressData.score),
      // Ensure attempts is an array. Client should send it as array.
      attempts: Array.isArray(progressData.attempts) ? progressData.attempts : [],
      completed: Boolean(progressData.completed),
    };
    

    await saveProgressToDb(completeProgressData);
    return NextResponse.json({ message: 'Progress saved successfully' }, { status: 200 });

  } catch (error) {
    console.error('[API /api/progress/round] Error saving progress:', error);
    // Check if error is due to JSON parsing
    if (error instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save round progress' }, { status: 500 });
  }
}
