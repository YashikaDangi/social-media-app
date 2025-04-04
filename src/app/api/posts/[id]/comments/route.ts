// src/app/api/posts/[id]/comments/route.ts
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyToken, findUserById } from '@/lib/auth';
import { CommentCreate } from '@/models/Post';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;
  
  try {
    if (!ObjectId.isValid(postId)) {
      return NextResponse.json({ message: 'Invalid post ID' }, { status: 400 });
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Get all comments for this post
    const comments = await db.collection('comments')
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: -1 }) // Show newest comments first
      .toArray();
    
    // Get all user IDs from comments
    const userIds = [...new Set(comments.map(comment => comment.userId.toString()))];
    
    // Get user data for all commenters
    const users = await db.collection('users')
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .project({ name: 1, email: 1 })
      .toArray();
    
    // Map users to comments
    const commentsWithUsers = comments.map(comment => {
      const user = users.find(u => u._id.toString() === comment.userId.toString());
      return {
        ...comment,
        _id: comment._id.toString(),
        postId: comment.postId.toString(),
        userId: comment.userId.toString(),
        author: user ? {
          name: user.name,
          email: user.email
        } : undefined
      };
    });
    
    return NextResponse.json(commentsWithUsers);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to get comments' },
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
    
    // Get comment data from request
    const { content } = await request.json();
    
    if (!content) {
      return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });
    }
    
    const userId = payload.userId;
    const client = await clientPromise;
    const db = client.db();
    
    // Check if post exists
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }
    
    // Create the comment using CommentCreate interface
    const comment: Omit<CommentCreate, '_id'> = {
      postId: new ObjectId(postId),
      userId: new ObjectId(userId),
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert the comment
    const result = await db.collection('comments').insertOne(comment);
    
    // Get user info for response
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      message: 'Comment added successfully',
      comment: {
        ...comment,
        _id: result.insertedId,
        postId: comment.postId.toString(),
        userId: comment.userId.toString(),
        author: {
          name: user.name,
          email: user.email
        }
      }
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Failed to add comment' },
      { status: 500 }
    );
  }
}