import { NextResponse } from 'next/server';

const META_GRAPH_VERSION = 'v18.0';

export async function GET() {
  const scopes = 'public_profile,ads_read,business_management,pages_show_list';
  const redirectUri = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
  
  const authUrl = `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?` +
    `client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scopes}&` +
    `response_type=code`;
  
  return NextResponse.redirect(authUrl);
}