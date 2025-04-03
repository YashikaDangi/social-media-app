import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { findOrCreateGoogleUser, generateToken } from '@/lib/auth';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=OAuthSignin`);
  }
  
  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token as string,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      throw new Error('Invalid Google credentials');
    }
    
    const user = await findOrCreateGoogleUser(payload);
    const jwtToken = generateToken(user._id as string);
    
    // Redirect to dashboard with token in query params
    // In a real app, you'd want to handle this more securely by setting an HTTP-only cookie
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error('Google callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/login?error=OAuthCallback`);
  }
}