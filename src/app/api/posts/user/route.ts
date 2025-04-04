// src/app/api/posts/user/route.ts
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
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
    
    const userId = payload.userId;
    const client = await clientPromise;
    const db = client.db();
    
    // Get user's posts
    const posts = await db.collection('posts')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get author information (in this case, the user's own info)
    const author = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, email: 1 } }
    );
    
    // Transform posts for response
    const transformedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      userId: post.userId.toString(),
      author: author ? {
        name: author.name,
        email: author.email
      } : undefined
    }));
    
    return NextResponse.json({
      posts: transformedPosts
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to fetch user posts' },
      { status: 500 }
    );
  }
}