// src/app/api/teacher/announcements/[id]/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const session = await getAppSession();

  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const result = await sql`
      DELETE FROM unit_test_announcements WHERE id = ${id};
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Announcement deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`[API Teacher Announcements] Error deleting announcement ${id}:`, error);
    return NextResponse.json({ error: 'Failed to delete announcement', details: (error as Error).message }, { status: 500 });
  }
}
