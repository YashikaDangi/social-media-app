export interface User {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    googleId?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  