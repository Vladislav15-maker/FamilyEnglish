// src/app/api/chat/groups/[groupId]/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';

async function resolveParam(paramsOrPromise: any, key: string) {
  const params = typeof paramsOrPromise?.then === 'function' ? await paramsOrPromise : paramsOrPromise;
  return params?.[key];
}

// helper: проверяет, есть ли колонка в таблице (возвращает true/false)
async function hasColumn(tableName: string, columnName: string) {
  try {
    const res = await sql`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = ${tableName} AND column_name = ${columnName}
      LIMIT 1;
    `;
    return !!(res && (res.rowCount ?? (res.rows ? res.rows.length : 0)));
  } catch (e) {
    console.warn('[hasColumn] error checking information_schema:', e);
    // при ошибке будем вести себя как будто колонки нет — безопаснее
    return false;
  }
}

export async function GET(
  request: Request,
  { params }: { params: any }
) {
  const groupId = await resolveParam(params, 'groupId');
  const session = await getAppSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as AuthenticatedUser;

  try {
    // Проверка членства
    const memberCheck = await sql`SELECT 1 FROM chat_group_members WHERE group_id = ${groupId} AND user_id = ${user.id} LIMIT 1;`;
    if (!memberCheck || (memberCheck.rowCount !== undefined && memberCheck.rowCount === 0)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Выясним, есть ли колонка creator_id — если есть, добавляем в SELECT, иначе получим без неё
    const hasCreator = await hasColumn('chat_groups', 'creator_id');

    const groupQuery = hasCreator
      ? sql`SELECT id, name, created_at, creator_id FROM chat_groups WHERE id = ${groupId} LIMIT 1;`
      : sql`SELECT id, name, created_at FROM chat_groups WHERE id = ${groupId} LIMIT 1;`;

    const membersQuery = sql`SELECT u.id, u.name, u.role FROM users u JOIN chat_group_members m ON u.id = m.user_id WHERE m.group_id = ${groupId};`;

    const [groupRes, membersRes] = await Promise.all([groupQuery, membersQuery]);

    if (!groupRes || (groupRes.rowCount !== undefined && groupRes.rowCount === 0)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Получаем сообщения (если table messages отсутствует — вернём пустой массив)
    let messagesRes;
    try {
      messagesRes = await sql`
        SELECT m.id, m.content, m.created_at, m.updated_at, m.is_deleted, m.sender_id, u.name as sender_name, u.role as sender_role
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.group_id = ${groupId}
        ORDER BY m.created_at ASC;
      `;
    } catch (e: any) {
      console.warn('[API Chat Group] messages read failed, returning empty array. Error:', e?.message ?? e);
      messagesRes = { rows: [] };
    }

    const group = groupRes.rows ? groupRes.rows[0] : groupRes[0];

    return NextResponse.json({
      group,
      members: membersRes.rows ?? membersRes,
      messages: messagesRes.rows ?? messagesRes,
      meta: { hasCreatorColumn: hasCreator }, // полезно для отладки
    });
  } catch (error) {
    console.error(`[API Chat Group GET ${groupId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch group details', details: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: any }
) {
  const groupId = await resolveParam(params, 'groupId');
  const session = await getAppSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as AuthenticatedUser;

  try {
    // Сначала получим группу (без ошибки, если creator_id нет)
    const groupRes = await sql`SELECT id${await (async () => {
      // add creator_id only if exists
      const hasCreator = await hasColumn('chat_groups', 'creator_id');
      return hasCreator ? sql`, creator_id` : sql``;
    })()} FROM chat_groups WHERE id = ${groupId} LIMIT 1;`;

    if (!groupRes || (groupRes.rowCount !== undefined && groupRes.rowCount === 0)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const group = groupRes.rows ? groupRes.rows[0] : groupRes[0];

    // Если есть creator_id — проверим, иначе разрешаем удалять только teacher
    const isCreator = group.creator_id && String(group.creator_id) === String(user.id);
    if (user.role !== 'teacher' && !isCreator) {
      return NextResponse.json({ error: 'Forbidden: you do not have rights to delete this group.' }, { status: 403 });
    }

    try {
      await sql`BEGIN;`;
      await sql`DELETE FROM messages WHERE group_id = ${groupId};`;
      await sql`DELETE FROM chat_group_members WHERE group_id = ${groupId};`;
      const deleted = await sql`DELETE FROM chat_groups WHERE id = ${groupId} RETURNING id;`;
      await sql`COMMIT;`;

      if (!deleted || (deleted.rowCount !== undefined && deleted.rowCount === 0)) {
        return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Group deleted successfully', id: groupId });
    } catch (txErr) {
      console.error('[API Chat Group DELETE] Transaction error:', txErr);
      try { await sql`ROLLBACK;`; } catch (_) { /* ignore */ }
      return NextResponse.json({ error: 'Failed to delete group (transaction failed)' }, { status: 500 });
    }
  } catch (error) {
    console.error(`[API Chat Group DELETE ${groupId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to delete group', details: (error as Error).message }, { status: 500 });
  }
}
