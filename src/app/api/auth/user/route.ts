import { NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const user = await findUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove password from user object
    const { ...userWithoutPassword } = user;
    
    return NextResponse.json({
      user: userWithoutPassword,
    });
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : 'Failed to get user';

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}