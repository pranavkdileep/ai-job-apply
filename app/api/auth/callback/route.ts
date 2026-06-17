import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { createSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const cookieStore = await cookies();
  const savedState = cookieStore.get("oauth_state")?.value;

  if (!state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${baseUrl}?auth_error=invalid_state`);
  }

  const res = NextResponse.redirect(baseUrl);
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}?auth_error=${encodeURIComponent(error || "no_code")}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${baseUrl}?auth_error=server_error`);
  }

  const redirectUri = `${baseUrl}/api/auth/callback`;

  try {
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
      console.error("Token exchange failed:", tokens.error);
      return NextResponse.redirect(`${baseUrl}?auth_error=token_exchange_failed`);
    }

    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userData = await userinfoResponse.json();
    if (!userinfoResponse.ok) {
      console.error("Failed to fetch userinfo:", userData.error);
      return NextResponse.redirect(`${baseUrl}?auth_error=userinfo_failed`);
    }

    const { db } = await connectToDatabase();

    const existingUser = await db.collection("users").findOne({ email: userData.email });

    let userId;
    if (existingUser) {
      userId = existingUser._id;
      const updateFields: Record<string, unknown> = {
        name: userData.name,
        picture: userData.picture,
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        updatedAt: new Date(),
      };
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

    await createSession(userId);

    return NextResponse.redirect(baseUrl);
  } catch {
    console.error("OAuth callback error");
    return NextResponse.redirect(`${baseUrl}?auth_error=server_error`);
  }
}
