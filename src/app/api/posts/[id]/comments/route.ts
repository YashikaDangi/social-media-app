import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

// Define the route handler with explicit param type
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get the params as a Promise and await it
    const { id } = await Promise.resolve(context.params);
    
    if (!id) {
      return NextResponse.json(
        { message: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Find comments for the specified post
    const comments = await db.collection('comments')
      .find({ postId: new ObjectId(id) })
      .sort({ createdAt: -1 }) // Newest first
      .toArray();
    
    // Convert ObjectIds to strings for JSON serialization
    const serializedComments = comments.map(comment => ({
      ...comment,
      _id: comment._id.toString(),
      postId: comment.postId.toString(),
      userId: comment.userId ? comment.userId.toString() : null,
    }));
    
    return NextResponse.json(serializedComments);
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST handler for creating comments
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get the params as a Promise and await it
    const { id } = await Promise.resolve(context.params);
    
    if (!id) {
      return NextResponse.json(
        { message: 'Post ID is required' },
        { status: 400 }
      );
    }
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    const { content, userId } = await request.json();
    
    if (!content) {
      return NextResponse.json(
        { message: 'Comment content is required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // First check if the post exists
    const post = await db.collection('posts').findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Create the comment
    const comment = {
      postId: new ObjectId(id),
      userId: userId ? new ObjectId(userId) : null,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('comments').insertOne(comment);
    
    return NextResponse.json({
      _id: result.insertedId.toString(),
      ...comment,
      postId: comment.postId.toString(),
      userId: comment.userId ? comment.userId.toString() : null,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create comment' },
      { status: 500 }
    );
  }
}