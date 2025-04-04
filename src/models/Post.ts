// src/models/Post.ts
import { ObjectId } from 'mongodb';

export interface Post {
  _id: string;
  userId: string | ObjectId;
  caption: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    name: string;
    email: string;
  };
  likes?: number;
  userLiked?: boolean; // Added to track if current user liked the post
}

// Interface for creating a comment (no _id needed)
export interface CommentCreate {
  postId: ObjectId;
  userId: ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for comment as stored in database
export interface Comment {
  _id?: ObjectId; // MongoDB will generate this
  postId: string | ObjectId;
  userId: string | ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Comment with author information
export interface CommentWithAuthor extends Comment {
  author?: {
    name: string;
    email: string;
  };
}

// Interface for creating a like (no _id needed)
export interface LikeCreate {
  postId: ObjectId;
  userId: ObjectId;
  createdAt: Date;
}

// Interface for like as stored in database
export interface Like {
  _id?: ObjectId; // MongoDB will generate this
  postId: string | ObjectId;
  userId: string | ObjectId;
  createdAt: Date;
}