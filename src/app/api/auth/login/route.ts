import { NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const user = await findUserByEmail(email);
    
    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    const token = generateToken(user._id as string);
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to login' },
      { status: 500 }
    );
  }
}
