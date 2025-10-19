// src/app/api/teacher/announcements/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';

export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Ensure table exists before querying
    await sql`
      CREATE TABLE IF NOT EXISTS unit_test_announcements (
        id SERIAL PRIMARY KEY,
        test_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const result = await sql`
      SELECT id, test_date, created_at 
      FROM unit_test_announcements
      ORDER BY test_date DESC;
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[API Teacher Announcements] Error fetching announcement history:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement history', details: (error as Error).message }, { status: 500 });
  }
}
