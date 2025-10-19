import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';
import * as z from 'zod';

const messageSchema = z.object({
  content: z.string().min(1, "Сообщение не может быть пустым.").max(2000, "Сообщение слишком длинное."),
  groupId: z.string().uuid("Требуется идентификатор группы."),
});

async function resolveParam(paramsOrPromise: any, key: string) {
  const params = typeof paramsOrPromise?.then === 'function' ? await paramsOrPromise : paramsOrPromise;
  return params?.[key];
}

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
      SELECT 1 FROM chat_group_members WHERE group_id = ${groupId} AND user_id = ${user.id} LIMIT 1;
    `;
    if (!memberCheck || (memberCheck.rowCount !== undefined && memberCheck.rowCount === 0)) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    // Ensure messages table exists (best-effort). Prefer performing migrations outside handlers.
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          sender_id UUID REFERENCES users(id),
          group_id TEXT,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          -- updated_at optional
          -- is_deleted optional
          updated_at TIMESTAMPTZ,
          is_deleted BOOLEAN DEFAULT FALSE
        );
      `;
      // index for group_id (text or uuid stored as text)
      await sql`CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);`;
    } catch (e) {
      console.warn('[API Chat POST] CREATE TABLE IF NOT EXISTS warnings (ignored):', e);
    }

    // Insert and RETURNING * to avoid specifying non-existing columns
    const result = await sql`
      INSERT INTO messages (sender_id, content, group_id)
      VALUES (${user.id}, ${content.trim()}, ${groupId})
      RETURNING *;
    `;

    const newMessage = result.rows ? result.rows[0] : result[0];

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
