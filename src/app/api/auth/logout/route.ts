import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    let sessionToken: string | null = null;

    // Try to get sessionToken from Authorization header first
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
        // Body might not be JSON or might be empty
      }
    }

    if (!sessionToken || sessionToken.trim() === '') {
      return NextResponse.json({
        error: "Session token is required in request body or Authorization header",
        code: "MISSING_SESSION_TOKEN"
      }, { status: 400 });
    }

    // Clean up expired sessions first
    const now = new Date().toISOString();
    await db.delete(sessions)
      .where(lt(sessions.expiresAt, now));

    // Find the session to ensure it exists
    const existingSession = await db.select()
      .from(sessions)
      .where(eq(sessions.sessionToken, sessionToken.trim()))
      .limit(1);

    if (existingSession.length === 0) {
      return NextResponse.json({
        error: "Session not found or already expired",
        code: "SESSION_NOT_FOUND"
      }, { status: 404 });
    }

    // Delete the session
    const deletedSession = await db.delete(sessions)
      .where(eq(sessions.sessionToken, sessionToken.trim()))
      .returning();

    if (deletedSession.length === 0) {
      return NextResponse.json({
        error: "Session not found or already expired",
        code: "SESSION_NOT_FOUND"
      }, { status: 404 });
    }

    return NextResponse.json({
      message: "Successfully logged out",
      sessionId: deletedSession[0].id
    }, { status: 200 });

  } catch (error) {
    console.error('POST logout error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}