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
      SELECT 1 FROM chat_group_members WHERE group_id = ${groupId} AND user_id = ${user.id} LIMIT 1;
    `;
    if (!memberCheck || (memberCheck.rowCount !== undefined && memberCheck.rowCount === 0)) {
      return NextResponse.json({ error: 'Forbidden: You are not a member of this group.' }, { status: 403 });
    }

    // Проверка: если messages существует, но в ней нет колонки group_id, добавить колонку.
    // Это важно: CREATE TABLE IF NOT EXISTS не изменит уже существующую таблицу.
    try {
      const colCheck = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'messages' AND column_name = 'group_id';
      `;

      if (!colCheck || (colCheck.rowCount !== undefined && colCheck.rowCount === 0)) {
        // пытаемся добавить как UUID (предпочтительно). Если не получится — добавим как text.
        try {
          await sql`ALTER TABLE messages ADD COLUMN group_id uuid;`;
          try {
            // если есть таблица chat_groups с id uuid, можно добавить FK (опасно если схемы разные) — оставим без FK.
            await sql`CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);`;
            console.info('[API Chat POST] Added messages.group_id as uuid.');
          } catch (e) {
            console.info('[API Chat POST] Added group_id as uuid but could not create index or FK (ignored).', e);
          }
        } catch (e) {
          console.warn('[API Chat POST] Failed to add group_id as uuid, trying as text. Error:', e?.message ?? e);
          try {
            await sql`ALTER TABLE messages ADD COLUMN group_id TEXT;`;
            await sql`CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);`;
            console.info('[API Chat POST] Added messages.group_id as text.');
          } catch (e2) {
            console.error('[API Chat POST] Failed to add group_id column (uuid and text). Error:', e2);
            // не фатализируем — дальше вставка упадёт и мы вернём понятную ошибку
          }
        }
      }
    } catch (e) {
      console.warn('[API Chat POST] Could not validate/add group_id column:', e);
    }

    // Вставляем сообщение. Передаём groupId как строку (без ::uuid), чтобы не вызвать ошибки, если колонка - varchar.
    const result = await sql`
      INSERT INTO messages (sender_id, content, group_id)
      VALUES (${user.id}, ${content.trim()}, ${groupId})
      RETURNING id, sender_id, content, group_id, created_at, updated_at, is_deleted;
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
