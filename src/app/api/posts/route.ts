import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { createPost, getPosts } from '@/lib/post';
import { saveImageFromRequest } from '@/lib/fileUpload';

// Create post
export async function POST(request: NextRequest) {
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

    // Process request data
    const formData = await request.formData();
    const content = formData.get('content') as string;
    
    if (!content) {
      return NextResponse.json(
        { message: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Handle image uploads
    let imagePaths: string[] = [];
    try {
      imagePaths = await saveImageFromRequest(request);
    } catch (error: any) {
      return NextResponse.json(
        { message: error.message || 'Error uploading images' },
        { status: 400 }
      );
    }
    
    // Create post in database
    const post = await createPost(payload.userId, content, imagePaths);
    
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

// Get posts with pagination
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const userId = url.searchParams.get('userId') || undefined;
    
    // Validate params
    if (page < 1 || limit < 1 || limit > 50) {
      return NextResponse.json(
        { message: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }
    
    // Get posts
    const { posts, total } = await getPosts(page, limit, userId);
    
    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}