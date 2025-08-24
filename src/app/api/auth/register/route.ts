import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract and sanitize inputs
    const email = body.email?.toString().trim().toLowerCase();
    const password = body.password?.toString();
    const name = body.name?.toString().trim();
    
    // Validate required fields
    if (!email) {
      return NextResponse.json({ 
        error: "Email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }
    
    if (!password) {
      return NextResponse.json({ 
        error: "Password is required",
        code: "MISSING_PASSWORD" 
      }, { status: 400 });
    }
    
    if (!name) {
      return NextResponse.json({ 
        error: "Name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL_FORMAT" 
      }, { status: 400 });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json({ 
        error: "Password must be at least 6 characters long",
        code: "WEAK_PASSWORD" 
      }, { status: 400 });
    }
    
    // Check if email already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return NextResponse.json({ 
        error: "Email already registered",
        code: "DUPLICATE_EMAIL" 
      }, { status: 409 });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const newUser = await db.insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();
    
    // Remove password from response
    const { password: _, ...userResponse } = newUser[0];
    
    return NextResponse.json(userResponse, { status: 201 });
    
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}