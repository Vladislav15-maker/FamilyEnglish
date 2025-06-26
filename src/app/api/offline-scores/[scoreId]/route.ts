// File: src/app/api/offline-scores/[scoreId]/route.ts
import { NextResponse } from 'next/server';
import { updateOfflineScore, deleteOfflineScore } from '@/lib/store';
import { getAppSession } from '@/app/api/auth/[...nextauth]/route';
import type { AuthenticatedUser } from '@/lib/types';
import * as z from 'zod';

const scoreUpdateSchema = z.object({
  score: z.coerce.number().min(2, "Оценка должна быть от 2 до 5").max(5, "Оценка должна быть от 2 до 5"),
  notes: z.string().optional(),
  passed: z.boolean(),
  testId: z.string().min(1, "Test ID is required"),
});

// PUT handler to update an existing offline score
export async function PUT(
  request: Request,
  { params }: { params: { scoreId: string } }
) {
  const { scoreId } = params;
  console.log(`[API /api/offline-scores/:scoreId] Received PUT for scoreId: ${scoreId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/offline-scores/:scoreId] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/offline-scores/:scoreId] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = scoreUpdateSchema.safeParse(body);

    if (!validation.success) {
      console.warn('[API /api/offline-scores/:scoreId] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const updatedScore = await updateOfflineScore(scoreId, validation.data);
    console.log(`[API /api/offline-scores/:scoreId] Score ${scoreId} updated successfully.`);
    return NextResponse.json(updatedScore);

  } catch (error) {
    console.error(`[API /api/offline-scores/:scoreId] Error updating score ${scoreId}:`, error);
    return NextResponse.json({ error: 'Failed to update offline score', details: (error as Error).message }, { status: 500 });
  }
}

// DELETE handler to delete an offline score
export async function DELETE(
  request: Request,
  { params }: { params: { scoreId: string } }
) {
  const { scoreId } = params;
  console.log(`[API /api/offline-scores/:scoreId] Received DELETE for scoreId: ${scoreId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/offline-scores/:scoreId] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/offline-scores/:scoreId] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }

  try {
    await deleteOfflineScore(scoreId);
    console.log(`[API /api/offline-scores/:scoreId] Score ${scoreId} deleted successfully.`);
    return NextResponse.json({ message: 'Score deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API /api/offline-scores/:scoreId] Error deleting score ${scoreId}:`, error);
    return NextResponse.json({ error: 'Failed to delete offline score', details: (error as Error).message }, { status: 500 });
  }
}
