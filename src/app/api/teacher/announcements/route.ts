// src/app/api/teacher/announcements/route.ts
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import * as z from 'zod';

const announcementSchema = z.object({
  content: z.string().min(1, "Текст объявления не может быть пустым.").max(500),
  isSpecial: z.boolean(),
});

// GET handler to fetch announcement history for the TEACHER
export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    // Ensure table exists before querying
    await sql`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        is_special BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    const result = await sql`
      SELECT id, content, is_special, created_at 
      FROM announcements
      ORDER BY created_at DESC;
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[API Teacher Announcements] Error fetching announcement history:', error);
    return NextResponse.json({ error: 'Failed to fetch announcement history', details: (error as Error).message }, { status: 500 });
  }
}

// POST handler to create a new announcement
export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validation = announcementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data provided', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    
    const { content, isSpecial } = validation.data;

    // Create table if it doesn't exist
     await sql`
      CREATE TABLE IF NOT EXISTS announcements (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        is_special BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    const result = await sql`
      INSERT INTO announcements (content, is_special)
      VALUES (${content}, ${isSpecial})
      RETURNING id, content, is_special, created_at;
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('[API Teacher Announcements] Error creating announcement:', error);
    return NextResponse.json({ error: 'Failed to create announcement', details: (error as Error).message }, { status: 500 });
  }
}
