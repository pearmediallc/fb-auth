import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore as any, sessionOptions);
  
  session.destroy();
  
  return NextResponse.json({ success: true });
}