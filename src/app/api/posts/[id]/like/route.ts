import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { LikeCreate } from '@/models/Post';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Await the params before accessing properties
    const { id } = await Promise.resolve(context.params);
    
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
    
    return NextResponse.json({
      likeCount,
      userLiked
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get like information';
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Await the params before accessing properties
    const { id } = await Promise.resolve(context.params);
    
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    
    const userId = payload.userId;
    const client = await clientPromise;
    const db = client.db();
    
    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: new ObjectId(id) });
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    // Check if user has already liked the post
    const existingLike = await db.collection('likes').findOne({
      postId: new ObjectId(id),
      userId: new ObjectId(userId)
    });
    
    let isLiked: boolean;
    if (existingLike) {
      // Unlike the post
      await db.collection('likes').deleteOne({
        postId: new ObjectId(id),
        userId: new ObjectId(userId)
      });
      isLiked = false;
    } else {
      // Like the post
      const like: Omit<LikeCreate, '_id'> = {
        postId: new ObjectId(id),
        userId: new ObjectId(userId),
        createdAt: new Date()
      };
      
      await db.collection('likes').insertOne(like);
      isLiked = true;
    }
    
    // Get updated like count
    const likeCount = await db.collection('likes').countDocuments({
      postId: new ObjectId(id)
    });
    
    return NextResponse.json({
      message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
      liked: isLiked,
      likeCount
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to like/unlike post';
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}