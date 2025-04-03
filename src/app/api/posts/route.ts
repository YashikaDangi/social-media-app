import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// GET handler for retrieving posts
export async function GET(request: Request) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const page = parseInt(url.searchParams.get('page') || '0');
    
    // Get posts with pagination
    const posts = await db.collection('posts')
      .find({})
      .sort({ createdAt: -1 })
      .skip(page * limit)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      posts,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST handler for creating a new post
export async function POST(request: Request) {
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
    
    // Parse request body (with error handling)
    let requestData;
    try {
      requestData = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { message: 'Invalid request format' },
        { status: 400 }
      );
    }
    
    // Validate post data
    const { title, content } = requestData;
    
    if (!title || !content) {
      return NextResponse.json(
        { message: 'Missing required fields: title and content are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // Create post
    const result = await db.collection('posts').insertOne({
      title,
      content,
      userId: payload.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Get the created post
    const post = await db.collection('posts').findOne({ _id: result.insertedId });
    
    return NextResponse.json({
      message: 'Post created successfully',
      post
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}