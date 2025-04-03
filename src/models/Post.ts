import { ObjectId } from 'mongodb';

export interface Post {
  _id: string;
  title: string;
  content: string;
  userId: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  likes?: string[];
  comments?: number;
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