import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { addComment, getComments } from '@/lib/post';

// Add a comment to a post
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
    
    const { id: postId } = params;
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Add comment
    const comment = await addComment(postId, payload.userId, content);
    
    return NextResponse.json({
      message: 'Comment added successfully',
      comment
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}

// Get comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = params;
    const url = new URL(request.url);
    
    // Parse pagination params
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { message: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }
    
    // Get comments
    const { comments, total } = await getComments(postId, page, limit);
    
    return NextResponse.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}