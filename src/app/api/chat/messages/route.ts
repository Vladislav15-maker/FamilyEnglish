
// src/app/api/chat/messages/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@/lib/auth';
import type { AuthenticatedUser } from '@/lib/types';
import { sql } from '@vercel/postgres';

// GET handler to fetch all messages
export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Make sure messages table exists
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;
    
    // Corrected JOIN query
    const result = await sql`
      SELECT 
        m.id, 
        m.sender_id, 
        m.content, 
        m.created_at, 
        u.name as sender_name, 
        u.role as sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at ASC;
    `;
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('[API Chat GET] Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages', details: (error as Error).message }, { status: 500 });
  }
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
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO messages (sender_id, content)
      VALUES (${user.id}, ${content.trim()})
      RETURNING id, sender_id, content, created_at;
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
