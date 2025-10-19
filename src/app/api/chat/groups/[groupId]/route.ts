// src/app/api/chat/groups/[groupId]/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';

// GET a single group's details, including members and messages
export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  const { groupId } = params;
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as AuthenticatedUser;

  try {
    // Security check: user must be a member of the group
    const memberCheck = await sql`SELECT 1 FROM chat_group_members WHERE group_id = ${groupId}::uuid AND user_id = ${user.id}::uuid;`;
    if (memberCheck.rowCount === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [groupRes, membersRes, messagesRes] = await Promise.all([
      sql`SELECT id, name, created_at FROM chat_groups WHERE id = ${groupId}::uuid;`,
      sql`SELECT u.id, u.name, u.role FROM users u JOIN chat_group_members m ON u.id = m.user_id WHERE m.group_id = ${groupId}::uuid;`,
      sql`
        SELECT m.id, m.content, m.created_at, m.updated_at, m.is_deleted, m.sender_id, u.name as sender_name, u.role as sender_role
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.group_id = ${groupId}::uuid
        ORDER BY m.created_at ASC;
      `
    ]);

    if (groupRes.rowCount === 0) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({
      group: groupRes.rows[0],
      members: membersRes.rows,
      messages: messagesRes.rows,
    });
  } catch (error) {
    console.error(`[API Chat Group GET ${groupId}] Error:`, error);
    // Handle case where messages table doesn't exist yet
    if ((error as any).code === '42P01' && (error as any).message.includes('messages')) {
        const [groupRes, membersRes] = await Promise.all([
             sql`SELECT id, name, created_at FROM chat_groups WHERE id = ${groupId}::uuid;`,
             sql`SELECT u.id, u.name, u.role FROM users u JOIN chat_group_members m ON u.id = m.user_id WHERE m.group_id = ${groupId}::uuid;`,
        ]);
         if (groupRes.rowCount === 0) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }
        return NextResponse.json({
            group: groupRes.rows[0],
            members: membersRes.rows,
            messages: [], // Return empty messages array
        });
    }
    return NextResponse.json({ error: 'Failed to fetch group details', details: (error as Error).message }, { status: 500 });
  }
}
