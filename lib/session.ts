import { cookies } from "next/headers";
import { connectToDatabase } from "./db";
import { ObjectId } from "mongodb";
import crypto from "crypto";

const SESSION_COOKIE_NAME = "session_id";

export interface Session {
  _id: string;
  userId: ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  picture: string;
  googleAccessToken: string;
  googleRefreshToken: string;
  googleTokenExpiry: Date;
  resume?: string;
  createdAt: Date;
}

export async function createSession(userId: ObjectId): Promise<string> {
  const { db } = await connectToDatabase();
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  const session: Session = {
    _id: sessionId,
    userId,
    createdAt: new Date(),
    expiresAt,
  };

  await db.collection<Session>("sessions").insertOne(session);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return sessionId;
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const { db } = await connectToDatabase();
  const session = await db.collection<Session>("sessions").findOne({
    _id: sessionId,
    expiresAt: { $gt: new Date() },
  });

  if (!session) return null;

  const user = await db.collection<User>("users").findOne({
    _id: session.userId,
  });

  return user;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    const { db } = await connectToDatabase();
    await db.collection<Session>("sessions").deleteOne({ _id: sessionId });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
