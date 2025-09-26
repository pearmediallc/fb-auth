import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore as any, sessionOptions);
  
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const db = await getDb();
    
    if ('sql' in db) {
      const result = await db.sql`
        SELECT id, meta_user_id, name, email 
        FROM users 
        WHERE id = ${session.userId}
      `;
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json(result.rows[0]);
    } else {
      const result = await db.pool!.query(
        'SELECT id, meta_user_id, name, email FROM users WHERE id = $1',
        [session.userId]
      );
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      return NextResponse.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}