// src/app/api/teacher/online-tests/[testId]/results/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { getOnlineTestResults, getAllStudents } from '@/lib/store';
import { getOnlineTestById } from '@/lib/curriculum-data';
import type { AuthenticatedUser, OnlineTestResult, User } from '@/lib/types';

export async function GET(
  request: Request,
  context: { params: { testId: string } }
) {
  const testId = context.params.testId;
  const session = await getAppSession();

  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const testDetails = getOnlineTestById(testId);
    if (!testDetails) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const [results, allStudents] = await Promise.all([
        getOnlineTestResults(testId),
        getAllStudents()
    ]);
    
    // Create a map of submitted students for quick lookup
    const submittedStudentIds = new Set(results.map(r => r.studentId));

    // Add students who haven't submitted yet to the list
    const unsubmittedStudents = allStudents
        .filter(student => !submittedStudentIds.has(student.id))
        .map(student => ({
            // Create a mock result object for unsubmitted students
            id: `unsubmitted-${student.id}`,
            studentId: student.id,
            studentName: student.name,
            onlineTestId: testId,
            score: 0,
            answers: [],
            completedAt: null, // Indicates not submitted
            isPassed: null,
            grade: null,
            teacherNotes: null,
            durationSeconds: null,
        }));

    const combinedResults = [...results, ...unsubmittedStudents];

    return NextResponse.json({ testDetails, results: combinedResults });

  } catch (error) {
    console.error(`[API] Error fetching results for online test ${testId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch test results', details: (error as Error).message }, { status: 500 });
  }
}
