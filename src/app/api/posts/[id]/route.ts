// src/app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
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
    
    // Get post by ID
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(postId)
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
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}