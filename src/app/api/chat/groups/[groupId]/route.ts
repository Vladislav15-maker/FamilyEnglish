import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';

async function resolveParam(paramsOrPromise: any, key: string) {
  const params = typeof paramsOrPromise?.then === 'function' ? await paramsOrPromise : paramsOrPromise;
  return params?.[key];
}

export async function GET(request: Request, { params }: { params: any }) {
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

    const [groupRes, membersRes] = await Promise.all([
      sql`SELECT id, name, created_at, creator_id FROM chat_groups WHERE id = ${groupId} LIMIT 1;`,
      sql`SELECT u.id, u.name, u.role FROM users u JOIN chat_group_members m ON u.id = m.user_id WHERE m.group_id = ${groupId};`,
    ]);

    if (!groupRes || (groupRes.rowCount !== undefined && groupRes.rowCount === 0)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

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

    return NextResponse.json({
      group: groupRes.rows ? groupRes.rows[0] : groupRes[0],
      members: membersRes.rows ?? membersRes,
      messages: messagesRes.rows ?? messagesRes,
    });
  } catch (error) {
    console.error(`[API Chat Group GET ${groupId}] Error:`, error);
    return NextResponse.json({ error: 'Failed to fetch group details', details: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: any }) {
  const groupId = await resolveParam(params, 'groupId');
  const session = await getAppSession();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = session.user as AuthenticatedUser;

  try {
    const groupRes = await sql`SELECT id, creator_id FROM chat_groups WHERE id = ${groupId} LIMIT 1;`;
    if (!groupRes || (groupRes.rowCount !== undefined && groupRes.rowCount === 0)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    const group = groupRes.rows ? groupRes.rows[0] : groupRes[0];

    if (user.role !== 'teacher' && String(group.creator_id) !== String(user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
