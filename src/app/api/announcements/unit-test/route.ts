// File: src/app/api/announcements/unit-test/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';

// GET handler to fetch the latest unit test announcement for STUDENTS
export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT id, test_date, created_at FROM unit_test_announcements
      ORDER BY test_date DESC;
    `;
    
    // Find the most recent announcement that is still in the future
    const upcomingAnnouncement = result.rows.find(announcement => new Date(announcement.test_date) > new Date());

    if (!upcomingAnnouncement) {
      return NextResponse.json(null, { status: 200 }); // No active announcement found
    }

    return NextResponse.json({
        id: upcomingAnnouncement.id,
        testDate: upcomingAnnouncement.test_date,
        createdAt: upcomingAnnouncement.created_at
    });
  } catch (error) {
    // If the table doesn't exist, it's not a critical error, just return null.
    if ((error as any).code === '42P01') { // 'undefined_table' error code in postgres
        console.warn('[API Announcements] `unit_test_announcements` table not found. Returning null.');
        return NextResponse.json(null, { status: 200 });
    }
    console.error('[API Announcements] Error fetching announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement', details: (error as Error).message }, { status: 500 });
  }
}

// POST handler to create a new unit test announcement
export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { testDate } = body;

    if (!testDate || isNaN(new Date(testDate).getTime())) {
      return NextResponse.json({ error: 'Invalid testDate provided' }, { status: 400 });
    }

    const testDateIso = new Date(testDate).toISOString();

    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS unit_test_announcements (
        id SERIAL PRIMARY KEY,
        test_date TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    const result = await sql`
      INSERT INTO unit_test_announcements (test_date)
      VALUES (${testDateIso})
      RETURNING id, test_date, created_at;
    `;

    const newAnnouncement = result.rows[0];

    return NextResponse.json({
        id: newAnnouncement.id,
        testDate: newAnnouncement.test_date,
        createdAt: newAnnouncement.created_at
    }, { status: 201 });
  } catch (error) {
    console.error('[API Announcements] Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement', details: (error as Error).message }, { status: 500 });
  }
}