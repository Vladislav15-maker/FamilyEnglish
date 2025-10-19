// File: src/app/api/announcements/unit-test/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// This file is now for fetching the LATEST announcement for STUDENTS
export async function GET(request: Request) {
  try {
    // Fetch the most recent announcement
    const result = await sql`
      SELECT id, content, is_special, created_at FROM announcements
      ORDER BY created_at DESC
      LIMIT 1;
    `;
    
    if (result.rowCount === 0) {
      return NextResponse.json(null, { status: 200 }); // No announcement found
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    // If the table doesn't exist, it's not a critical error for the student view.
    if ((error as any).code === '42P01') { // 'undefined_table' error code in postgres
        console.warn('[API Announcements] `announcements` table not found. Returning null.');
        return NextResponse.json(null, { status: 200 });
    }
    console.error('[API Announcements] Error fetching latest announcement:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement', details: (error as Error).message }, { status: 500 });
  }
}
