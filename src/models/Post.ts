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
}

export interface Comment {
  _id?: string | ObjectId;
  postId: string | ObjectId;
  userId: string | ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Like {
  _id?: string | ObjectId;
  postId: string | ObjectId;
  userId: string | ObjectId;
  createdAt: Date;
}