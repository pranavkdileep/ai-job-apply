import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createSession } from "@/lib/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}?auth_error=${encodeURIComponent(error || "no_code")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${baseUrl}/api/auth/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Missing GOOGLE credentials in env variables" },
      { status: 500 }
    );
  }

  try {
    // Exchange authorization code for access and refresh tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokens);
      return NextResponse.redirect(`${baseUrl}?auth_error=token_exchange_failed`);
    }

    // Fetch Google profile user info
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userData = await userinfoResponse.json();
    if (!userinfoResponse.ok) {
      console.error("Failed to fetch userinfo:", userData);
      return NextResponse.redirect(`${baseUrl}?auth_error=userinfo_failed`);
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: userData.email });

    let userId;
    if (existingUser) {
      userId = existingUser._id;
      const updateFields: any = {
        name: userData.name,
        picture: userData.picture,
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        updatedAt: new Date(),
      };
      // Keep existing refresh token if Google didn't send a new one
      if (tokens.refresh_token) {
        updateFields.googleRefreshToken = tokens.refresh_token;
      }
      await db.collection("users").updateOne({ _id: userId }, { $set: updateFields });
    } else {
      const newUser = {
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || "",
        googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        resume: "",
        createdAt: new Date(),
      };
      const result = await db.collection("users").insertOne(newUser);
      userId = result.insertedId;
    }

    // Generate database session and set HTTP-only cookie
    await createSession(userId);

    return NextResponse.redirect(baseUrl);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}?auth_error=server_error`);
  }
}
