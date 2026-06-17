import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";
import { ObjectId } from "mongodb";
import nodemailer from "nodemailer";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TokenUser {
  _id: ObjectId;
  googleAccessToken: string;
  googleRefreshToken: string;
  googleTokenExpiry: Date;
  name: string;
  email: string;
}

async function getOrRefreshAccessToken(user: TokenUser): Promise<string> {
  const isExpired = new Date(user.googleTokenExpiry).getTime() - 60000 < Date.now();
  if (!isExpired) {
    return user.googleAccessToken;
  }

  if (!user.googleRefreshToken) {
    throw new Error("auth");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("config");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: user.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Failed to refresh OAuth token:", data.error);
    throw new Error("auth");
  }

  const { db } = await connectToDatabase();
  const newAccessToken = data.access_token;
  const newExpiry = new Date(Date.now() + data.expires_in * 1000);

  const updateFields: Record<string, unknown> = {
    googleAccessToken: newAccessToken,
    googleTokenExpiry: newExpiry,
    updatedAt: new Date(),
  };

  if (data.refresh_token) {
    updateFields.googleRefreshToken = data.refresh_token;
  }

  await db.collection("users").updateOne({ _id: user._id }, { $set: updateFields });

  return newAccessToken;
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`send-email:${user._id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const formData = await req.formData();
    const to = formData.get("to");
    const subject = formData.get("subject");
    const body = formData.get("body");
    const resumePdf = formData.get("resumePdf");

    if (typeof to !== "string" || typeof subject !== "string" || typeof body !== "string" || !to || !subject || !body) {
      return NextResponse.json(
        { error: "Recipient, subject, and email body are required." },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(to)) {
      return NextResponse.json({ error: "Invalid recipient email address." }, { status: 400 });
    }

    if (subject.length > 500) {
      return NextResponse.json({ error: "Subject is too long (max 500 characters)." }, { status: 400 });
    }

    if (body.length > 50000) {
      return NextResponse.json({ error: "Email body is too long (max 50,000 characters)." }, { status: 400 });
    }

    if (resumePdf instanceof File && resumePdf.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Resume PDF must be under 5MB." }, { status: 400 });
    }

    if (resumePdf instanceof File && resumePdf.size > 0 && resumePdf.type !== "application/pdf") {
      return NextResponse.json({ error: "Resume attachment must be a PDF file." }, { status: 400 });
    }

    let accessToken: string;
    try {
      accessToken = await getOrRefreshAccessToken(user as unknown as TokenUser);
    } catch {
      return NextResponse.json({ error: "Failed to authenticate with Google. Please log in again." }, { status: 401 });
    }

    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });

    const attachments = [];
    if (resumePdf instanceof File && resumePdf.size > 0) {
      const resumeBuffer = Buffer.from(await resumePdf.arrayBuffer());
      attachments.push({
        filename: resumePdf.name || "resume.pdf",
        content: resumeBuffer,
        contentType: "application/pdf",
      });
    }

    const mailOptions = {
      from: `"${user.name}" <${user.email}>`,
      to,
      subject,
      text: body,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    const rawMessage = info.message.toString();

    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const sendResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    const sendResult = await sendResponse.json();
    if (!sendResponse.ok) {
      console.error("Gmail Send API error:", sendResult.error?.message);
      return NextResponse.json(
        { error: "Failed to send email via Gmail. Please try again." },
        { status: 500 }
      );
    }

    const { db } = await connectToDatabase();
    await db.collection("applications").insertOne({
      userId: user._id,
      recipientEmail: to,
      subject,
      body,
      resumeAttached: attachments.length > 0,
      gmailMessageId: sendResult.id,
      status: "sent",
      sentAt: new Date(),
    });

    return NextResponse.json({ success: true, messageId: sendResult.id });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
