import { ObjectId } from 'mongodb';

export interface Post {
  _id?: string | ObjectId;
  userId: string | ObjectId;
  content: string;
  images?: string[];
  likes: string[] | ObjectId[];
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
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