import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { findOrCreateGoogleUser, generateToken } from '@/lib/auth';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXTAUTH_URL}/api/auth/google/callback`
);

export async function GET(request: Request) {
  const authUrl = googleClient.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent',
  });
  
  return NextResponse.redirect(authUrl);
}
