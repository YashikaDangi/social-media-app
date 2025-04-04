import { NextResponse } from "next/server";
import { createUser, generateToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await createUser(name, email, password);
    const token = generateToken(user._id as string);

    // Create a new object without the password field
    const {  ...userWithoutPassword } = user;

    return NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    // Type-safe error handling
    const errorMessage = error instanceof Error 
      ? error.message 
      : typeof error === 'string'
        ? error
        : "Failed to register user";

    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}