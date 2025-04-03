import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { Post, Comment, Like } from '@/models/Post';
import { User } from '@/models/User';

// Post operations
export async function createPost(userId: string, content: string, images: string[] = []): Promise<Post> {
  const client = await clientPromise;
  const db = client.db();
  
  const post: Omit<Post, '_id'> = {
    userId: new ObjectId(userId),
    content,
    images,
    likes: [],
    commentsCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = await db.collection('posts').insertOne(post);
  
  return {
    ...post,
    _id: result.insertedId.toString()
  } as Post;
}

export async function getPosts(page: number = 1, limit: number = 10, userId?: string): Promise<{ posts: Post[], total: number }> {
    const client = await clientPromise;
    const db = client.db();
    
    const skip = (page - 1) * limit;
    const query = userId ? { userId: new ObjectId(userId) } : {};
    
    const [posts, total] = await Promise.all([
      db.collection('posts')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('posts').countDocuments(query)
    ]);
    
    // Convert ObjectIds to strings for consistent representation
    const formattedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      userId: post.userId.toString(),
      // Fix: Add explicit type to 'like' parameter
      likes: post.likes.map((like: ObjectId) => like.toString())
    }));
    
    return { posts: formattedPosts as Post[], total };
  }

export async function getPostWithDetails(postId: string): Promise<Post | null> {
  const client = await clientPromise;
  const db = client.db();
  
  try {
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    
    if (!post) return null;
    
    // Convert ObjectIds to strings
    return {
      ...post,
      _id: post._id.toString(),
      userId: post.userId.toString(),
      likes: post.likes.map((id: ObjectId) => id.toString())
    } as Post;
  } catch (error) {
    console.error('Error in getPostWithDetails:', error);
    return null;
  }
}

export async function updatePost(postId: string, content: string, images?: string[]): Promise<Post | null> {
  const client = await clientPromise;
  const db = client.db();
  
  const updateData: Partial<Post> = {
    content,
    updatedAt: new Date()
  };
  
  if (images) {
    updateData.images = images;
  }
  
  try {
    const result = await db.collection('posts').findOneAndUpdate(
      { _id: new ObjectId(postId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;
    
    // Convert ObjectIds to strings
    return {
      ...result,
      _id: result._id.toString(),
      userId: result.userId.toString(),
      likes: result.likes.map((id: ObjectId) => id.toString())
    } as Post;
  } catch (error) {
    console.error('Error in updatePost:', error);
    return null;
  }
}

export async function deletePost(postId: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db();
  
  try {
    // Delete post
    const result = await db.collection('posts').deleteOne({ _id: new ObjectId(postId) });
    
    if (result.deletedCount === 1) {
      // Delete associated comments
      await db.collection('comments').deleteMany({ postId: new ObjectId(postId) });
      
      // Delete associated likes
      await db.collection('likes').deleteMany({ postId: new ObjectId(postId) });
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in deletePost:', error);
    return false;
  }
}

// Like operations
export async function likePost(postId: string, userId: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db();
  
  try {
    // Check if already liked
    const existingLike = await db.collection('likes').findOne({
      postId: new ObjectId(postId),
      userId: new ObjectId(userId)
    });
    
    if (existingLike) {
      return true; // Already liked
    }
    
    // Create like record
    await db.collection('likes').insertOne({
      postId: new ObjectId(postId),
      userId: new ObjectId(userId),
      createdAt: new Date()
    });
    
    // Update post's likes array
    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $addToSet: { likes: new ObjectId(userId) } }
    );
    
    return true;
  } catch (error) {
    console.error('Error in likePost:', error);
    return false;
  }
}

export async function unlikePost(postId: string, userId: string): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db();
    
    try {
      // Remove like record
      await db.collection('likes').deleteOne({
        postId: new ObjectId(postId),
        userId: new ObjectId(userId)
      });
      
      // Remove user from post's likes array
      // Fix: Use proper type for $pull operator
      await db.collection('posts').updateOne(
        { _id: new ObjectId(postId) },
        { $pull: { likes: new ObjectId(userId) } as any }
      );
      
      return true;
    } catch (error) {
      console.error('Error in unlikePost:', error);
      return false;
    }
  }

export async function getPostLikes(postId: string, page: number = 1, limit: number = 20): Promise<{ users: User[], total: number }> {
  const client = await clientPromise;
  const db = client.db();
  
  try {
    const skip = (page - 1) * limit;
    
    // Get post to access the likes array
    const post = await db.collection('posts').findOne({ _id: new ObjectId(postId) });
    
    if (!post || !post.likes.length) {
      return { users: [], total: 0 };
    }
    
    // Get users who liked the post
    const users = await db.collection('users')
      .find({ _id: { $in: post.likes } })
      .skip(skip)
      .limit(limit)
      .project({ password: 0 }) // Exclude password
      .toArray();
    
    // Convert ObjectIds to strings
    const formattedUsers = users.map(user => ({
      ...user,
      _id: user._id.toString()
    }));
    
    return { users: formattedUsers as User[], total: post.likes.length };
  } catch (error) {
    console.error('Error in getPostLikes:', error);
    return { users: [], total: 0 };
  }
}

// Comment operations
export async function addComment(postId: string, userId: string, content: string): Promise<Comment> {
  const client = await clientPromise;
  const db = client.db();
  
  const comment: Omit<Comment, '_id'> = {
    postId: new ObjectId(postId),
    userId: new ObjectId(userId),
    content,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    // Insert comment
    const result = await db.collection('comments').insertOne(comment);
    
    // Increment comments count in post
    await db.collection('posts').updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { commentsCount: 1 } }
    );
    
    return {
      ...comment,
      _id: result.insertedId.toString(),
      postId: postId,
      userId: userId
    } as Comment;
  } catch (error) {
    console.error('Error in addComment:', error);
    throw error;
  }
}

export async function getComments(postId: string, page: number = 1, limit: number = 10): Promise<{ comments: (Comment & { user: Partial<User> })[], total: number }> {
  const client = await clientPromise;
  const db = client.db();
  
  const skip = (page - 1) * limit;
  
  try {
    const [comments, total] = await Promise.all([
      db.collection('comments')
        .find({ postId: new ObjectId(postId) })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('comments').countDocuments({ postId: new ObjectId(postId) })
    ]);
    
    // Get user info for each comment
    const userIds = comments.map(comment => comment.userId);
    const users = await db.collection('users')
      .find({ _id: { $in: userIds } })
      .project({ password: 0 }) // Exclude password
      .toArray();
    
    // Create a map of userId to user
    const userMap = users.reduce((map, user) => ({
      ...map,
      [user._id.toString()]: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email
      }
    }), {});
    
    // Format comments with user data
    const formattedComments = comments.map(comment => ({
      ...comment,
      _id: comment._id.toString(),
      postId: comment.postId.toString(),
      userId: comment.userId.toString(),
      user: userMap[comment.userId.toString()]
    }));
    
    return { comments: formattedComments as (Comment & { user: Partial<User> })[], total };
  } catch (error) {
    console.error('Error in getComments:', error);
    return { comments: [], total: 0 };
  }
}

export async function updateComment(commentId: string, userId: string, content: string): Promise<Comment | null> {
  const client = await clientPromise;
  const db = client.db();
  
  try {
    const result = await db.collection('comments').findOneAndUpdate(
      { 
        _id: new ObjectId(commentId),
        userId: new ObjectId(userId) // Ensure user owns the comment
      },
      { 
        $set: { 
          content,
          updatedAt: new Date()
        } 
      },
      { returnDocument: 'after' }
    );
    
    if (!result) return null;
    
    return {
      ...result,
      _id: result._id.toString(),
      postId: result.postId.toString(),
      userId: result.userId.toString()
    } as Comment;
  } catch (error) {
    console.error('Error in updateComment:', error);
    return null;
  }
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  const client = await clientPromise;
  const db = client.db();
  
  try {
    // Find comment to get postId
    const comment = await db.collection('comments').findOne({
      _id: new ObjectId(commentId),
      userId: new ObjectId(userId) // Ensure user owns the comment
    });
    
    if (!comment) return false;
    
    // Delete comment
    const result = await db.collection('comments').deleteOne({
      _id: new ObjectId(commentId)
    });
    
    if (result.deletedCount === 1) {
      // Decrement comments count in post
      await db.collection('posts').updateOne(
        { _id: comment.postId },
        { $inc: { commentsCount: -1 } }
      );
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in deleteComment:', error);
    return false;
  }
}