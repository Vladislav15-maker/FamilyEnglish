import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';

async function resolveParam(paramsOrPromise: any, key: string) {
  // params может быть обещанием в некоторых версиях Next — поэтому безопасно await
  const params = typeof paramsOrPromise?.then === 'function' ? await paramsOrPromise : paramsOrPromise;
  return params?.[key];
}

// GET a single group's details, including members and messages
export async function GET(
  request: Request,
  { params }: { params: any } // keep as any to be tolerant
) {
  const groupId = await resolveParam(params, 'groupId');
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as AuthenticatedUser;

  try {
    // Security check: user must be a member of the group
    const memberCheck = await sql`
      SELECT 1 FROM chat_group_members WHERE group_id = ${groupId} AND user_id = ${user.id} LIMIT 1;
    `;
    if (!memberCheck || (memberCheck.rowCount !== undefined && memberCheck.rowCount === 0)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [groupRes, membersRes] = await Promise.all([
      sql`SELECT id, name, created_at FROM chat_groups WHERE id = ${groupId} LIMIT 1;`,
      sql`
        SELECT u.id, u.name, u.role
        FROM users u
        JOIN chat_group_members m ON u.id = m.user_id
        WHERE m.group_id = ${groupId};
      `,
    ]);

    if (!groupRes || (groupRes.rowCount !== undefined && groupRes.rowCount === 0)) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // messages may not exist → catch and return empty list
    let messagesRes;
    try {
      messagesRes = await sql`
        SELECT m.id, m.content, m.created_at, m.updated_at, m.is_deleted, m.sender_id, u.name as sender_name, u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.group_id = ${groupId}
        ORDER BY m.created_at ASC;
      `;
    } catch (e: any) {
      if (e?.code === '42P01' || e?.message?.includes('does not exist')) {
        console.warn('[API Chat Group] `messages` table not found, returning empty messages array.');
        messagesRes = { rows: [] };
      } else {
        throw e;
      }
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
