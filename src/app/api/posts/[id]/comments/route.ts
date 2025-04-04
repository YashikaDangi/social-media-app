import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import { verifyToken } from '@/lib/auth';

// GET handler for fetching comments
export async function GET(
  request: Request,
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Find comments for the specified post
    // Use an aggregation to join with users collection to get author details
    const comments = await db.collection('comments')
      .aggregate([
        { 
          $match: { 
            postId: new ObjectId(id) 
          } 
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'author'
          }
        },
        {
          $unwind: {
            path: '$author',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            postId: 1,
            userId: 1,
            content: 1,
            createdAt: 1,
            updatedAt: 1,
            'author.name': 1,
            'author.email': 1
          }
        },
        { 
          $sort: { 
            createdAt: -1 
          } 
        }
      ])
      .toArray();
    
    // Convert ObjectIds to strings for JSON serialization
    const serializedComments = comments.map(comment => ({
      ...comment,
      _id: comment._id.toString(),
      postId: comment.postId.toString(),
      userId: comment.userId ? comment.userId.toString() : null,
    }));
    
    return NextResponse.json(serializedComments);
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : 'Failed to fetch comments';

    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

// POST handler for creating comments
export async function POST(
  request: Request,
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid post ID format' },
        { status: 400 }
      );
    }
    
    // Verify user token to get userId
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload || !payload.userId) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const { content } = await request.json();
    
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
    
    // Create the comment with proper userId from token
    const comment = {
      postId: new ObjectId(id),
      userId: new ObjectId(payload.userId),
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('comments').insertOne(comment);
    
    // After creating the comment, fetch the user details to include in response
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(payload.userId) },
      { projection: { name: 1, email: 1 } }
    );
    
    // Return the newly created comment with author info
    return NextResponse.json({
      comment: {
        _id: result.insertedId.toString(),
        postId: id,
        userId: payload.userId,
        content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        author: user ? {
          name: user.name,
          email: user.email
        } : null
      }
    }, { status: 201 });
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : 'Failed to create comment';

    console.error('Error creating comment:', error);
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}