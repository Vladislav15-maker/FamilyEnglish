// File: src/app/api/student/online-tests/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { ONLINE_TESTS } from '@/lib/curriculum-data';
import { getStudentOnlineTestResults } from '@/lib/store';
import type { AuthenticatedUser } from '@/lib/types';

// This endpoint returns the list of available online tests for a student,
// along with their last result if they have taken it before.
export async function GET(request: Request) {
  const session = await getAppSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = session.user as AuthenticatedUser;

  try {
    const studentResults = await getStudentOnlineTestResults(user.id);
    
    const testsWithStatus = ONLINE_TESTS.map(test => {
      const result = studentResults.find(r => r.onlineTestId === test.id);
      return {
        ...test,
        lastResult: result || null, // Attach last result if it exists
      };
    });
    
    return NextResponse.json(testsWithStatus);

  } catch (error) {
    console.error('[API /api/student/online-tests] Error fetching online tests status:', error);
    return NextResponse.json({ error: 'Failed to fetch online tests', details: (error as Error).message }, { status: 500 });
  }
}
