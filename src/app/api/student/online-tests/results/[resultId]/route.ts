// src/app/api/student/online-tests/results/[resultId]/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import { getOnlineTestResultById } from '@/lib/store';
import type { AuthenticatedUser } from '@/lib/types';
import { getOnlineTestById } from '@/lib/curriculum-data';

export async function GET(
  request: Request,
  { params }: { params: { resultId: string } }
) {
  const resultId = params.resultId;
  const session = await getAppSession();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as AuthenticatedUser;

  try {
    const result = await getOnlineTestResultById(resultId);
    if (!result) {
        return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }
    // Security check: ensure the user is requesting their own result
    if (result.studentId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const testDetails = getOnlineTestById(result.onlineTestId);
    
    return NextResponse.json({ result, testDetails });

  } catch (error) {
    console.error(`[API] Error fetching online test result ${resultId}:`, error);
    return NextResponse.json({ error: 'Failed to fetch test result', details: (error as Error).message }, { status: 500 });
  }
}
