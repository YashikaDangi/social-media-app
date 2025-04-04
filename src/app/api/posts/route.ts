import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get all posts
export async function GET(request: NextRequest) {
  try {
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
    
    const client = await clientPromise;
    const db = client.db();
    
    // Aggregate to get posts with author details
    const posts = await db.collection('posts')
      .aggregate([
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
            caption: 1,
            imageUrl: 1,
            createdAt: 1,
            updatedAt: 1,
            likes: 1,
            'author.name': 1,
            'author.email': 1
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray();
    
    return NextResponse.json({
      posts: posts.map(post => ({
        ...post,
        _id: post._id instanceof ObjectId ? post._id.toString() : post._id,
        userId: post.userId instanceof ObjectId ? post.userId.toString() : post.userId
      }))
    });
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : 'Failed to fetch posts';

    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}

// Create a new post
export async function POST(request: NextRequest) {
  try {
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
    
    const user = await findUserById(payload.userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    const { caption, imageUrl } = await request.json();
    
    if (!caption || !imageUrl) {
      return NextResponse.json(
        { message: 'Caption and image URL are required' },
        { status: 400 }
      );
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('posts').insertOne({
      userId: new ObjectId(user._id), // Make sure this is an ObjectId
      caption,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0
    });
    
    // Fetch the created post with author details
    const newPost = await db.collection('posts')
      .aggregate([
        {
          $match: { _id: result.insertedId }
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
            userId: 1, // Make sure this is included
            caption: 1,
            imageUrl: 1,
            createdAt: 1,
            updatedAt: 1,
            likes: 1,
            'author.name': 1,
            'author.email': 1
          }
        }
      ])
      .toArray();
    
    const post = newPost[0];
    
    if (post && post._id) {
      return NextResponse.json({
        message: 'Post created successfully',
        post: {
          ...post,
          _id: post._id.toString(),
          userId: post.userId ? post.userId.toString() : user._id
        }
      });
    }

    // Fallback if no post is found
    throw new Error('Failed to create post');
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : 'Failed to create post';

    console.error('Error creating post:', error);
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}