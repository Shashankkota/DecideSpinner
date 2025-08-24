import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: "Missing or invalid authorization header",
        code: "MISSING_AUTH_HEADER" 
      }, { status: 401 });
    }

    const sessionToken = authHeader.substring(7);
    
    if (!sessionToken) {
      return NextResponse.json({ 
        error: "Session token is required",
        code: "MISSING_SESSION_TOKEN" 
      }, { status: 401 });
    }

    const currentTime = new Date().toISOString();

    // Clean up expired sessions first
    await db.delete(sessions)
      .where(gte(currentTime, sessions.expiresAt));

    // Find valid session with user data
    const result = await db.select({
      sessionId: sessions.id,
      sessionToken: sessions.sessionToken,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      name: users.name,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ 
        error: "Invalid or expired session token",
        code: "INVALID_SESSION" 
      }, { status: 401 });
    }

    const sessionData = result[0];

    // Double-check session expiration
    if (new Date(sessionData.expiresAt) <= new Date()) {
      // Clean up this expired session
      await db.delete(sessions)
        .where(eq(sessions.sessionToken, sessionToken));
      
      return NextResponse.json({ 
        error: "Session has expired",
        code: "EXPIRED_SESSION" 
      }, { status: 401 });
    }

    // Return user data without password
    const userData = {
      id: sessionData.userId,
      email: sessionData.email,
      name: sessionData.name,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt
    };

    return NextResponse.json(userData, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}