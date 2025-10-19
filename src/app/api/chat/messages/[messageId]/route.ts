import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';
import * as z from 'zod';

const messageEditSchema = z.object({
  content: z.string().min(1, "Сообщение не может быть пустым.").max(2000),
});

// PUT handler to edit a message
export async function PUT(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  const { messageId } = params;
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as AuthenticatedUser;

  try {
    const body = await request.json();
    const validation = messageEditSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { content } = validation.data;

    const result = await sql`
      UPDATE messages
      SET 
        content = ${content},
        updated_at = NOW()
      WHERE id = ${messageId} AND sender_id = ${user.id}
      RETURNING id, sender_id, content, group_id, created_at, updated_at;
    `;

    if (!result || (result.rowCount !== undefined && result.rowCount === 0)) {
      return NextResponse.json({ error: 'Message not found or you do not have permission to edit it.' }, { status: 404 });
    }

    return NextResponse.json(result.rows ? result.rows[0] : result[0]);

  } catch (error) {
    console.error(`[API Chat PUT ${messageId}] Error editing message:`, error);
    return NextResponse.json({ error: 'Failed to edit message', details: (error as Error).message }, { status: 500 });
  }
}

// DELETE handler to delete a message
export async function DELETE(
  request: Request,
  { params }: { params: { messageId: string } }
) {
  const { messageId } = params;
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as AuthenticatedUser;

  try {
    // A teacher can delete any message. A student can only delete their own.
    let result;
    if (user.role === 'teacher') {
        result = await sql`DELETE FROM messages WHERE id = ${messageId} RETURNING id;`;
    } else {
        result = await sql`DELETE FROM messages WHERE id = ${messageId} AND sender_id = ${user.id} RETURNING id;`;
    }
    
    if (!result || (result.rowCount !== undefined && result.rowCount === 0)) {
      return NextResponse.json({ error: 'Message not found or you do not have permission to delete it.' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message deleted successfully', id: messageId });
  } catch (error) {
    console.error(`[API Chat DELETE ${messageId}] Error deleting message:`, error);
    return NextResponse.json({ error: 'Failed to delete message', details: (error as Error).message }, { status: 500 });
  }
}
