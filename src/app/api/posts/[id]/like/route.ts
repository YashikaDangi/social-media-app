// src/app/api/posts/[id]/like/route.ts
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';
import { LikeCreate } from '@/models/Post';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  
  try {
    if (!ObjectId.isValid(postId)) {
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
      postId: new ObjectId(postId)
    });
    
    // Check if current user has liked the post
    let userLiked = false;
    if (userId) {
      const existingLike = await db.collection('likes').findOne({
        postId: new ObjectId(postId),
        userId: new ObjectId(userId)
      });
      userLiked = !!existingLike;
    }
    
    return NextResponse.json({
      likeCount,
      userLiked
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to get like information' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  
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
    
    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    
    const userId = payload.userId;
    const client = await clientPromise;
    const db = client.db();
    
    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    // Check if user has already liked the post
    const existingLike = await db.collection('likes').findOne({
      postId: new ObjectId(postId),
      userId: new ObjectId(userId)
    });
    
    let result;
    if (existingLike) {
      // Unlike the post
      result = await db.collection('likes').deleteOne({
        postId: new ObjectId(postId),
        userId: new ObjectId(userId)
      });
    } else {
      // Like the post
      const like: Omit<LikeCreate, '_id'> = {
        postId: new ObjectId(postId),
        userId: new ObjectId(userId),
        createdAt: new Date()
      };
      
      result = await db.collection('likes').insertOne(like);
    }
    
    // Get updated like count
    const likeCount = await db.collection('likes').countDocuments({
      postId: new ObjectId(postId)
    });
    
    return NextResponse.json({
      message: existingLike ? 'Post unliked successfully' : 'Post liked successfully',
      liked: !existingLike,
      likeCount
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to like/unlike post' },
      { status: 500 }
    );
  }
}