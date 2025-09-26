import { NextRequest, NextResponse } from 'next/server';
import { getDb, initializeDatabase } from '@/lib/db';
import { encryptToken } from '@/lib/crypto';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

const META_GRAPH_VERSION = 'v18.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=${error}`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=no_code`);
  }
  
  try {
    await initializeDatabase();
    
    const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
    
    // Exchange code for access token
    const tokenResponse = await fetch(`${META_GRAPH_URL}/oauth/access_token?` + 
      new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: redirectUri,
        code,
      })
    );
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      throw new Error('No access token received');
    }
    
    // Get user data
    const userResponse = await fetch(`${META_GRAPH_URL}/me?` +
      new URLSearchParams({
        fields: 'id,name,email',
        access_token: tokenData.access_token,
      })
    );
    
    const userData = await userResponse.json();
    
    // Save to database
    const db = await getDb();
    let userId: number;
    
    if (db.sql) {
      // Vercel Postgres
      const existingUser = await db.sql`
        SELECT id FROM users WHERE meta_user_id = ${userData.id}
      `;
      
      if (existingUser.rows.length === 0) {
        const newUser = await db.sql`
          INSERT INTO users (meta_user_id, name, email)
          VALUES (${userData.id}, ${userData.name}, ${userData.email})
          RETURNING id
        `;
        userId = newUser.rows[0].id;
      } else {
        userId = existingUser.rows[0].id;
        await db.sql`
          UPDATE users 
          SET name = ${userData.name}, email = ${userData.email}, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${userId}
        `;
      }
      
      // Store encrypted token
      const encryptedToken = encryptToken(tokenData.access_token);
      const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
      
      await db.sql`
        DELETE FROM user_tokens WHERE user_id = ${userId}
      `;
      
      await db.sql`
        INSERT INTO user_tokens (user_id, access_token, token_type, expires_at)
        VALUES (${userId}, ${encryptedToken}, ${tokenData.token_type}, ${expiresAt?.toISOString() || null})
      `;
    } else if (db.pool) {
      // Local development
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');
        
        const userResult = await client.query(
          'SELECT id FROM users WHERE meta_user_id = $1',
          [userData.id]
        );
        
        if (userResult.rows.length === 0) {
          const insertResult = await client.query(
            'INSERT INTO users (meta_user_id, name, email) VALUES ($1, $2, $3) RETURNING id',
            [userData.id, userData.name, userData.email]
          );
          userId = insertResult.rows[0].id;
        } else {
          userId = userResult.rows[0].id;
          await client.query(
            'UPDATE users SET name = $1, email = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [userData.name, userData.email, userId]
          );
        }
        
        const encryptedToken = encryptToken(tokenData.access_token);
        const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null;
        
        await client.query('DELETE FROM user_tokens WHERE user_id = $1', [userId]);
        await client.query(
          'INSERT INTO user_tokens (user_id, access_token, token_type, expires_at) VALUES ($1, $2, $3, $4)',
          [userId, encryptedToken, tokenData.token_type, expiresAt]
        );
        
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } else {
      throw new Error('No database connection');
    }
    
    // Create session
    const cookieStore = cookies();
    const session = await getIronSession<SessionData>(cookieStore as any, sessionOptions);
    session.userId = userId;
    session.isLoggedIn = true;
    await session.save();
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_failed`);
  }
}