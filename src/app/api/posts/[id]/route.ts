import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getPostWithDetails, updatePost, deletePost } from '@/lib/post';
import { saveImageFromRequest } from '@/lib/fileUpload';

// Get a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { message: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    const post = await getPostWithDetails(id);
    
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ post });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// Update a post
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
    
    const { id } = params;
    
    // Get existing post to verify ownership
    const existingPost = await getPostWithDetails(id);
    
    if (!existingPost) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Verify post ownership
    if (existingPost.userId !== payload.userId) {
      return NextResponse.json(
        { message: 'You can only update your own posts' },
        { status: 403 }
      );
    }
    
    // Process request data
    const formData = await request.formData();
    const content = formData.get('content') as string;
    
    if (!content) {
      return NextResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Handle image uploads
    let imagePaths = existingPost.images || [];
    try {
      // Check if there are new images
      const hasNewImages = Array.from(formData.keys()).some(key => key === 'images');
      
      if (hasNewImages) {
        const newImagePaths = await saveImageFromRequest(request);
        imagePaths = [...imagePaths, ...newImagePaths];
      }
    } catch (error: any) {
      return NextResponse.json(
        { message: error.message || 'Error uploading images' },
        { status: 400 }
      );
    }
    
    // Check if user wants to remove images
    const removeImages = formData.getAll('removeImages') as string[];
    if (removeImages.length > 0) {
      imagePaths = imagePaths.filter(path => !removeImages.includes(path));
    }
    
    // Update post in database
    const updatedPost = await updatePost(id, content, imagePaths);
    
    if (!updatedPost) {
      return NextResponse.json(
        { message: 'Failed to update post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error: any) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

// Delete a post
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
    
    // Get existing post to verify ownership
    const existingPost = await getPostWithDetails(id);
    
    if (!existingPost) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Verify post ownership
    if (existingPost.userId !== payload.userId) {
      return NextResponse.json(
        { message: 'You can only delete your own posts' },
        { status: 403 }
      );
    }
    
    // Delete post
    const success = await deletePost(id);
    
    if (!success) {
      return NextResponse.json(
        { message: 'Failed to delete post' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Post deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}