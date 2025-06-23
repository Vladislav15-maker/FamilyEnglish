// File: src/app/api/progress/student/[studentId]/round/[roundId]/attempts/route.ts
import { NextResponse } from 'next/server';
import { getAttemptHistoryForRound } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser } from '@/lib/types';

console.log('[API ROUTE ATTEMPTING TO LOAD] /api/progress/student/[studentId]/round/[roundId]/attempts/route.ts');

export async function GET(
  request: Request,
  { params }: { params: { studentId: string; roundId: string } }
) {
  const { studentId, roundId } = params;
  console.log(`[API attempts] Received GET for studentId: ${studentId}, roundId: ${roundId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API attempts] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API attempts] Forbidden access by user ${loggedInUser.id}`);
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  if (!studentId || !roundId) {
    console.error('[API attempts] Student ID and Round ID are required');
    return NextResponse.json({ error: 'Student ID and Round ID are required' }, { status: 400 });
  }

  // Unit ID is not strictly required for this query if roundId is unique enough,
  // but for completeness, we could require it in the future.
  // The store function `getAttemptHistoryForRound` needs to be adapted if unitId is also needed for lookup.
  // For now, let's assume roundId is sufficient with studentId. The store function needs to handle this.
  
  // Let's refine this to get unitId from the URL as well to be more precise, assuming it will be passed.
  // The route should probably be /api/progress/student/[studentId]/unit/[unitId]/round/[roundId]/attempts
  // But for now, we'll assume the client knows the unitId and our store function can work with it.
  // Let's assume the client passes unitId as a query parameter for now.
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unitId');

  if (!unitId) {
      console.error('[API attempts] Unit ID is required as a query parameter');
      return NextResponse.json({ error: 'Unit ID query parameter is required' }, { status: 400 });
  }


  try {
    const history = await getAttemptHistoryForRound(studentId, unitId, roundId);
    console.log(`[API attempts] Fetched ${history.length} attempt history items.`);
    return NextResponse.json(history);
  } catch (error) {
    console.error(`[API attempts] Error fetching attempt history:`, error);
    return NextResponse.json({ error: 'Failed to fetch attempt history', details: (error as Error).message }, { status: 500 });
  }
}
