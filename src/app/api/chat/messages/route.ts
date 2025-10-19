import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';
import * as z from 'zod';

const messageSchema = z.object({
  content: z.string().min(1).max(2000),
  groupId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as AuthenticatedUser;

  try {
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { content, groupId } = parsed.data;

    const memberCheck = await sql`SELECT 1 FROM chat_group_members WHERE group_id = ${groupId} AND user_id = ${user.id} LIMIT 1;`;
    if (!memberCheck || (memberCheck.rowCount !== undefined && memberCheck.rowCount === 0)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Попытка вставки сообщения. RETURNING * — безопасно независимо от списка колонок
    const insert = await sql`
      INSERT INTO messages (sender_id, content, group_id)
      VALUES (${user.id}, ${content.trim()}, ${groupId})
      RETURNING *;
    `;

    if (!insert || (insert.rowCount !== undefined && insert.rowCount === 0)) {
      console.error('[API Chat POST] Insert returned no rows:', insert);
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
    }

    const newMessage = insert.rows ? insert.rows[0] : insert[0];
    const out = { ...newMessage, sender_name: user.name, sender_role: user.role };

    return NextResponse.json(out, { status: 201 });
  } catch (err: any) {
    console.error('[API Chat POST] Error:', err);
    return NextResponse.json({ error: 'Failed to send message', details: err?.message ?? String(err) }, { status: 500 });
  }
}
