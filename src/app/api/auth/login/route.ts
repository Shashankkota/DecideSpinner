import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

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

    // Sanitize email input
    const sanitizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await db.select()
      .from(users)
      .where(eq(users.email, sanitizedEmail))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json({ 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS" 
      }, { status: 401 });
    }

    const foundUser = user[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, foundUser.password);

    if (!passwordMatch) {
      return NextResponse.json({ 
        error: "Invalid credentials",
        code: "INVALID_CREDENTIALS" 
      }, { status: 401 });
    }

    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Set session expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create session record
    const newSession = await db.insert(sessions)
      .values({
        userId: foundUser.id,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        createdAt: new Date().toISOString()
      })
      .returning();

    // Prepare user object without password
    const { password: _, ...userWithoutPassword } = foundUser;

    // Return success response
    return NextResponse.json({
      user: userWithoutPassword,
      sessionToken
    }, { status: 200 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}