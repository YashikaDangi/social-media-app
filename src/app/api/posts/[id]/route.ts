import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    
    // Check if user is authenticated
    let userId = null;
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      userId = payload?.userId || null;
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get post by ID
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(id)
    });
    
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    // Get author information
    const author = await db.collection('users').findOne(
      { _id: new ObjectId(post.userId) },
      { projection: { name: 1, email: 1 } }
    );
    
    // Get like count
    const likeCount = await db.collection('likes').countDocuments({
      postId: new ObjectId(id)
    });
    
    // Check if current user has liked the post
    let userLiked = false;
    if (userId) {
      const existingLike = await db.collection('likes').findOne({
        postId: new ObjectId(id),
        userId: new ObjectId(userId)
      });
      userLiked = !!existingLike;
    }
    
    // Transform the post for the response
    const postWithDetails = {
      ...post,
      _id: post._id.toString(),
      userId: post.userId.toString(),
      author: author ? {
        name: author.name,
        email: author.email
      } : undefined,
      likes: likeCount,
      userLiked
    };
    
    return NextResponse.json(postWithDetails);
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : 'Failed to fetch post';

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
    
    const {postId} =  await params;

    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    
    const userId = payload.userId;
    const client = await clientPromise;
    const db = client.db();
    
    // Find the post to ensure it exists and belongs to the user
    const post = await db.collection('posts').findOne({ 
      _id: new ObjectId(postId)
    });
    
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    // Check if the user is the owner of the post
    if (post.userId.toString() !== userId) {
      return NextResponse.json({ message: 'Not authorized to delete this post' }, { status: 403 });
    }
    
    // Delete the post
    await db.collection('posts').deleteOne({ _id: new ObjectId(postId) });
    
    // Delete associated likes and comments
    await db.collection('likes').deleteMany({ postId: new ObjectId(postId) });
    await db.collection('comments').deleteMany({ postId: new ObjectId(postId) });
    
    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : 'Failed to delete post';

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}