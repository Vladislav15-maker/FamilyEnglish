// src/app/api/chat/groups/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';
import * as z from 'zod';

const groupSchema = z.object({
  name: z.string().min(3, "Название группы должно содержать не менее 3 символов.").max(50),
  memberIds: z.array(z.string()).min(1, "В группе должен быть хотя бы один участник."),
});

// GET all groups for the current user
export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as AuthenticatedUser;

  try {
    const result = await sql`
      SELECT g.id, g.name, g.created_by, g.created_at
      FROM chat_groups g
      JOIN chat_group_members m ON g.id = m.group_id
      WHERE m.user_id = ${user.id}
      ORDER BY g.created_at DESC;
    `;
    return NextResponse.json(result.rows);
  } catch (error) {
    // Gracefully handle if table doesn't exist yet
    if ((error as any).code === '42P01') {
      return NextResponse.json([], { status: 200 });
    }
    console.error('[API Chat Groups GET] Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups', details: (error as Error).message }, { status: 500 });
  }
}

// POST a new group (teacher only)
export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user || (session.user as AuthenticatedUser).role !== 'teacher') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const teacher = session.user as AuthenticatedUser;

  try {
    const body = await request.json();
    const validation = groupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { name, memberIds } = validation.data;
    
    // Step 0: Ensure tables exist
    await sql`
      CREATE TABLE IF NOT EXISTS chat_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS chat_group_members (
        group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        PRIMARY KEY (group_id, user_id)
      );
    `;

    // Ensure teacher is always part of the group
    const finalMemberIds = Array.from(new Set([...memberIds, teacher.id]));

    // Step 1: Create the group
    const groupResult = await sql`
      INSERT INTO chat_groups (name, created_by)
      VALUES (${name}, ${teacher.id})
      RETURNING id, name, created_by, created_at;
    `;

    if (groupResult.rowCount === 0) {
      throw new Error("Не удалось создать группу.");
    }
    const newGroup = groupResult.rows[0];
    const newGroupId = newGroup.id;

    // Step 2: Insert members one by one
    for (const userId of finalMemberIds) {
      await sql`INSERT INTO chat_group_members (group_id, user_id) VALUES (${newGroupId}, ${userId});`;
    }

    return NextResponse.json(newGroup, { status: 201 });

  } catch (error) {
    console.error('[API Chat Groups POST] Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group', details: (error as Error).message }, { status: 500 });
  }
}
