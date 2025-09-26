import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { decryptToken } from '@/lib/crypto';
import { getIronSession } from 'iron-session';
import { sessionOptions, SessionData } from '@/lib/session';
import { cookies } from 'next/headers';

const META_GRAPH_VERSION = 'v18.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

async function getUserToken(userId: number) {
  const pool = await getDb();
  
  // Use pool directly
  const result = await pool.query(
    'SELECT access_token FROM user_tokens WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  
  if (result.rows.length === 0) {
    throw new Error('No token found');
  }
  
  return decryptToken(result.rows[0].access_token);
}

function getAccountStatus(status: number): string {
  const statusMap: { [key: number]: string } = {
    1: 'Active',
    2: 'Disabled',
    3: 'Unsettled',
    7: 'Pending Risk Review',
    8: 'Pending Settlement',
    9: 'In Grace Period',
    100: 'Pending Closure',
    101: 'Closed',
    201: 'Any Active',
    202: 'Any Closed'
  };
  return statusMap[status] || 'Unknown';
}

export async function GET() {
  const cookieStore = cookies();
  const session = await getIronSession<SessionData>(cookieStore as any, sessionOptions);
  
  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const pool = await getDb();
    
    // Check cache first
    const cacheResult = await pool.query(
      'SELECT account_data, cached_at FROM ad_accounts_cache WHERE user_id = $1 ORDER BY cached_at DESC LIMIT 1',
      [session.userId]
    );
    
    const cacheAge = cacheResult.rows.length > 0 
      ? Date.now() - new Date(cacheResult.rows[0].cached_at).getTime()
      : Infinity;
    
    if (cacheAge < 5 * 60 * 1000) { // 5 minutes cache
      return NextResponse.json(cacheResult.rows[0].account_data);
    }
    
    // Fetch fresh data
    const accessToken = await getUserToken(session.userId);
    
    const response = await fetch(`${META_GRAPH_URL}/me/adaccounts?` +
      new URLSearchParams({
        fields: 'id,name,account_status,currency,timezone_name,business,spend_cap,amount_spent,balance,owner,funding_source,business_name,account_id',
        access_token: accessToken,
        limit: '100'
      })
    );
    
    const data = await response.json();
    
    if (data.error) {
      if (data.error.code === 190) {
        return NextResponse.json({ error: 'Token expired', code: 'TOKEN_EXPIRED' }, { status: 401 });
      }
      throw new Error(data.error.message);
    }
    
    const adAccounts = data.data.map((account: any) => ({
      id: account.id,
      account_id: account.account_id,
      name: account.name,
      status: getAccountStatus(account.account_status),
      currency: account.currency,
      timezone: account.timezone_name,
      role: account.business?.name || 'Direct Access',
      spend_cap: account.spend_cap,
      amount_spent: account.amount_spent,
      balance: account.balance,
      owner: account.owner,
      funding_source: account.funding_source,
      business_name: account.business_name
    }));
    
    // Cache the results
    const accountData = JSON.stringify({ accounts: adAccounts });
    await pool.query(
      'INSERT INTO ad_accounts_cache (user_id, account_data) VALUES ($1, $2)',
      [session.userId, accountData]
    );
    
    return NextResponse.json({ accounts: adAccounts });
    
  } catch (error) {
    console.error('Get ad accounts error:', error);
    return NextResponse.json({ error: 'Failed to fetch ad accounts' }, { status: 500 });
  }
}