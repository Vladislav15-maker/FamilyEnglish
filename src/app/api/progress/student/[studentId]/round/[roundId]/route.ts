// File: src/app/api/progress/student/[studentId]/round/[roundId]/route.ts
import { NextResponse } from 'next/server';
import { deleteStudentRoundProgress } from '@/lib/store';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';

export async function DELETE(
  request: Request,
  { params }: { params: { studentId: string; roundId: string } }
) {
  const { studentId, roundId } = params;
  const { searchParams } = new URL(request.url);
  const unitId = searchParams.get('unitId');

  console.log(`[API progress DELETE] Received DELETE for student ${studentId}, unit ${unitId}, round ${roundId}`);

  const session = await getAppSession();
  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!studentId || !unitId || !roundId) {
    return NextResponse.json({ error: 'Missing studentId, unitId, or roundId' }, { status: 400 });
  }

  try {
    await deleteStudentRoundProgress(studentId, unitId, roundId);
    return NextResponse.json({ message: 'Progress deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API progress DELETE] Error deleting progress:`, error);
    return NextResponse.json({ error: 'Failed to delete progress', details: (error as Error).message }, { status: 500 });
  }
}
