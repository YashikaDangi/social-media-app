import { NextResponse } from 'next/server';
import { createUser, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const user = await createUser(name, email, password);
    const token = generateToken(user._id as string);
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json({
      message: 'User created successfully',
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to register user' },
      { status: 500 }
    );
  }
}