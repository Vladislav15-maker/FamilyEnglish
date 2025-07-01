// File: src/app/api/teacher/unit-grades/[gradeId]/route.ts
import { NextResponse } from 'next/server';
import { updateStudentUnitGrade, deleteStudentUnitGrade } from '@/lib/store';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import * as z from 'zod';

const gradeUpdateSchema = z.object({
  grade: z.coerce.number().min(2, "Grade must be between 2 and 5").max(5, "Grade must be between 2 and 5"),
  notes: z.string().optional(),
});

// PUT handler to update an existing unit grade
export async function PUT(
  request: Request,
  { params }: { params: { gradeId: string } }
) {
  const { gradeId } = params;
  console.log(`[API /api/teacher/unit-grades/:gradeId] Received PUT for gradeId: ${gradeId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/teacher/unit-grades/:gradeId] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/teacher/unit-grades/:gradeId] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = gradeUpdateSchema.safeParse(body);

    if (!validation.success) {
      console.warn('[API /api/teacher/unit-grades/:gradeId] Validation failed:', validation.error.flatten().fieldErrors);
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const updatedGrade = await updateStudentUnitGrade(gradeId, validation.data);
    console.log(`[API /api/teacher/unit-grades/:gradeId] Grade ${gradeId} updated successfully.`);
    return NextResponse.json(updatedGrade);

  } catch (error) {
    console.error(`[API /api/teacher/unit-grades/:gradeId] Error updating grade ${gradeId}:`, error);
    return NextResponse.json({ error: 'Failed to update unit grade', details: (error as Error).message }, { status: 500 });
  }
}

// DELETE handler to delete a unit grade
export async function DELETE(
  request: Request,
  { params }: { params: { gradeId: string } }
) {
  const { gradeId } = params;
  console.log(`[API /api/teacher/unit-grades/:gradeId] Received DELETE for gradeId: ${gradeId}`);
  const session = await getAppSession();

  if (!session || !session.user) {
    console.warn('[API /api/teacher/unit-grades/:gradeId] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loggedInUser = session.user as AuthenticatedUser;
  if (loggedInUser.role !== 'teacher') {
    console.warn(`[API /api/teacher/unit-grades/:gradeId] Forbidden: User ${loggedInUser.username} is not a teacher.`);
    return NextResponse.json({ error: 'Forbidden: Access restricted to teachers' }, { status: 403 });
  }

  try {
    await deleteStudentUnitGrade(gradeId);
    console.log(`[API /api/teacher/unit-grades/:gradeId] Grade ${gradeId} deleted successfully.`);
    return NextResponse.json({ message: 'Grade deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API /api/teacher/unit-grades/:gradeId] Error deleting grade ${gradeId}:`, error);
    return NextResponse.json({ error: 'Failed to delete unit grade', details: (error as Error).message }, { status: 500 });
  }
}
