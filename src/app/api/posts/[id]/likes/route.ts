import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { likePost, unlikePost, getPostLikes } from '@/lib/post';

// Like a post
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
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
    
    const { id } = params;
    
    // Like the post
    const success = await likePost(id, payload.userId);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to like post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Post liked successfully'
    });
  } catch (error: any) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to like post' },
      { status: 500 }
    );
  }
}

// Unlike a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
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
    
    const { id } = params;
    
    // Unlike the post
    const success = await unlikePost(id, payload.userId);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to unlike post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Post unliked successfully'
    });
  } catch (error: any) {
    console.error('Error unliking post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to unlike post' },
      { status: 500 }
    );
  }
}

// Get users who liked a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const url = new URL(request.url);
    
    // Parse pagination params
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { message: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }
    
    // Get likes
    const { users, total } = await getPostLikes(id, page, limit);
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching post likes:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch post likes' },
      { status: 500 }
    );
  }
}