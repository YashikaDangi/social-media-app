import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { updateComment, deleteComment } from '@/lib/post';

// Update a comment
export async function PUT(
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
    
    const { id: commentId } = params;
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    // Update comment
    const updatedComment = await updateComment(commentId, payload.userId, content);
    
    if (!updatedComment) {
      return NextResponse.json(
        { message: 'Comment not found or you are not authorized to edit it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update comment' },
      { status: 500 }
    );
  }
}

// Delete a comment
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
    
    const { id: commentId } = params;
    
    // Delete comment
    const success = await deleteComment(commentId, payload.userId);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Comment not found or you are not authorized to delete it' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Comment deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete comment' },
      { status: 500 }
    );
  }
}