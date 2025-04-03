// Fixed src/app/api/posts/[id]/route.ts
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// DELETE - Delete a post
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    
    // Validate postId
    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json(
        { message: 'Invalid post ID' },
        { status: 400 }
      );
    }
    
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
    
    const client = await clientPromise;
    const db = client.db();
    
    // Find the post to check ownership
    const post = await db.collection('posts').findOne({
      _id: new ObjectId(postId)
    });
    
    if (!post) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if the current user is the post owner
    if (post.userId.toString() !== payload.userId) {
      return NextResponse.json(
        { message: 'You do not have permission to delete this post' },
        { status: 403 }
      );
    }
    
    // Delete the post
    await db.collection('posts').deleteOne({
      _id: new ObjectId(postId)
    });
    
    return NextResponse.json({
      message: 'Post deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// GET - Fetch a single post
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    
    // Validate postId
    if (!postId || !ObjectId.isValid(postId)) {
      return NextResponse.json(
        { message: 'Invalid post ID' },
        { status: 400 }
      );
    }
    
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
    
    const client = await clientPromise;
    const db = client.db();
    
    // Find the post with user information
    const post = await db.collection('posts').aggregate([
      {
        $match: { _id: new ObjectId(postId) }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $addFields: {
          user: { 
            $cond: {
              if: { $gt: [{ $size: "$userInfo" }, 0] },
              then: {
                _id: { $arrayElemAt: ["$userInfo._id", 0] },
                name: { $arrayElemAt: ["$userInfo.name", 0] },
                email: { $arrayElemAt: ["$userInfo.email", 0] }
              },
              else: null
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          content: 1,
          userId: 1,
          createdAt: 1,
          updatedAt: 1,
          likes: 1,
          user: 1
        }
      }
    ]).toArray();
    
    if (post.length === 0) {
      return NextResponse.json(
        { message: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Format ObjectIds to strings for JSON serialization
    const formattedPost = {
      ...post[0],
      _id: post[0]._id.toString(),
      userId: post[0].userId.toString(),
      user: post[0].user ? {
        ...post[0].user,
        _id: post[0].user._id.toString()
      } : undefined
    };
    
    return NextResponse.json({ post: formattedPost });
  } catch (error: any) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch post' },
      { status: 500 }
    );
  }
}