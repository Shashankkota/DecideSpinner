import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, sessions } from '@/db/schema';
import { eq, gte } from 'drizzle-orm';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Extract sessionToken from body or Authorization header
    let sessionToken: string | null = null;
    
    // Try to get from Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7);
    }
    
    // If not in header, try to get from request body
    if (!sessionToken) {
      try {
        const body = await request.json();
        sessionToken = body.sessionToken;
      } catch (error) {
        // Body might not be JSON, continue with null sessionToken
      }
    }

    // Validate sessionToken is provided
    if (!sessionToken) {
      return NextResponse.json({ 
        error: "Session token is required",
        code: "MISSING_SESSION_TOKEN" 
      }, { status: 400 });
    }

    // Find existing session and join with user data
    const currentTime = new Date().toISOString();
    const sessionData = await db.select({
      sessionId: sessions.id,
      userId: sessions.userId,
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.sessionToken, sessionToken))
    .limit(1);

    // Check if session exists
    if (sessionData.length === 0) {
      return NextResponse.json({ 
        error: "Session not found",
        code: "SESSION_NOT_FOUND" 
      }, { status: 404 });
    }

    const session = sessionData[0];

    // Check if session has expired
    if (session.expiresAt < currentTime) {
      return NextResponse.json({ 
        error: "Session has expired",
        code: "SESSION_EXPIRED" 
      }, { status: 401 });
    }

    // Generate new session token
    const newSessionToken = crypto.randomBytes(32).toString('hex');
    
    // Calculate new expiration time (24 hours from now)
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 24);

    // Update session with new token and expiration time
    const updatedSession = await db.update(sessions)
      .set({
        sessionToken: newSessionToken,
        expiresAt: newExpiresAt.toISOString()
      })
      .where(eq(sessions.id, session.sessionId))
      .returning();

    if (updatedSession.length === 0) {
      return NextResponse.json({ 
        error: "Failed to update session",
        code: "SESSION_UPDATE_FAILED" 
      }, { status: 500 });
    }

    // Return success response with new session token and user data
    return NextResponse.json({
      sessionToken: newSessionToken,
      expiresAt: newExpiresAt.toISOString(),
      user: session.user
    }, { status: 200 });

  } catch (error) {
    console.error('POST session refresh error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}