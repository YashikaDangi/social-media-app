// File: lib/auth.ts
import { hash, compare } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import clientPromise from './mongodb';
import { User } from '@/models/User';

export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await compare(password, hashedPassword);
}

export function generateToken(userId: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): { userId: string } | null {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  try {
    const decoded = verify(token, process.env.JWT_SECRET) as { userId: string };
    console.log("Token verified successfully, userId:", decoded.userId);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function createUser(name: string, email: string, password: string): Promise<User> {
  const client = await clientPromise;
  const db = client.db();
  
  const existingUser = await db.collection('users').findOne({ email });
  
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  const hashedPassword = await hashPassword(password);
  
  const result = await db.collection('users').insertOne({
    name,
    email,
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  return {
    _id: result.insertedId.toString(),
    name,
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const client = await clientPromise;
  const db = client.db();
  
  const user = await db.collection('users').findOne({ email });
  
  if (!user) {
    return null;
  }
  
  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    password: user.password,
    googleId: user.googleId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  } as User;
}
export async function findUserById(userId: string): Promise<User | null> {
  console.log("Looking for user with ID:", userId);
  
  const client = await clientPromise;
  const db = client.db();
  
  try {
    // Always convert to ObjectId for querying
    try {
      const objectId = new ObjectId(userId);
      const userDoc = await db.collection('users').findOne({ _id: objectId });
      
      if (userDoc) {
        console.log("User found with ID");
        // Convert MongoDB document to User type
        return {
          _id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          password: userDoc.password,
          googleId: userDoc.googleId,
          createdAt: userDoc.createdAt,
          updatedAt: userDoc.updatedAt
        } as User;
      }
    } catch (err) {
      console.log("Error with ObjectId conversion:", err);
      
      // Try alternative query approaches if ObjectId conversion fails
      // For example, if you have a custom field that might store the ID as string
      const userByCustomField = await db.collection('users').findOne({ userId: userId });
      
      if (userByCustomField) {
        console.log("User found with custom userId field");
        return {
          _id: userByCustomField._id.toString(),
          name: userByCustomField.name,
          email: userByCustomField.email,
          password: userByCustomField.password,
          googleId: userByCustomField.googleId,
          createdAt: userByCustomField.createdAt,
          updatedAt: userByCustomField.updatedAt
        } as User;
      }
    }
    
    console.log("User not found");
    return null;
  } catch (error) {
    console.error("Error in findUserById:", error);
    throw error;
  }
}

export async function findOrCreateGoogleUser(profile: any): Promise<User> {
  const { name, email, sub: googleId } = profile;
  console.log("Processing Google user:", { name, email, googleId });
  
  const client = await clientPromise;
  const db = client.db();
  
  // Try to find user by Google ID first
  let dbUser = await db.collection('users').findOne({ googleId });
  
  // If not found by Google ID, try by email
  if (!dbUser) {
    dbUser = await db.collection('users').findOne({ email });
    
    // If found by email, update the Google ID
    if (dbUser) {
      console.log("User found by email, updating with Google ID");
      await db.collection('users').updateOne(
        { email },
        { $set: { googleId, updatedAt: new Date() } }
      );
      
      dbUser = await db.collection('users').findOne({ email });
    } else {
      // Create new user
      console.log("Creating new user from Google data");
      const newUser = {
        name,
        email,
        googleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const result = await db.collection('users').insertOne(newUser);
      
      return {
        _id: result.insertedId.toString(),
        ...newUser
      } as User;
    }
  }
  
  if (dbUser) {
    console.log("Returning found user with ID:", dbUser._id);
    return {
      _id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      password: dbUser.password,
      googleId: dbUser.googleId,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    } as User;
  }
  
  throw new Error("Failed to find or create Google user");
}