// src/app/api/chat/messages/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';
import * as z from 'zod';

const messageSchema = z.object({
  content: z.string().min(1, "Сообщение не может быть пустым.").max(2000, "Сообщение слишком длинное."),
  groupId: z.string().uuid("Требуется идентификатор группы."),
});

// POST handler to send a new message
export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as AuthenticatedUser;

  try {
    const body = await request.json();
    const validation = messageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { content, groupId } = validation.data;

    // Security Check: Verify the user is a member of the group they're posting to
    const memberCheck = await sql`
      SELECT 1 FROM chat_group_members WHERE group_id = ${groupId}::uuid AND user_id = ${user.id}::uuid;
    `;
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    const result = await sql`
      INSERT INTO messages (sender_id, content, group_id)
      VALUES (${user.id}::uuid, ${content.trim()}, ${groupId}::uuid)
      RETURNING id, sender_id, content, group_id, created_at, updated_at;
    `;

    const newMessage = result.rows[0];

    const finalMessage = {
      ...newMessage,
      sender_name: user.name,
      sender_role: user.role,
    }

    return NextResponse.json(finalMessage, { status: 201 });
  } catch (error) {
    console.error('[API Chat POST] Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message', details: (error as Error).message }, { status: 500 });
  }
}
