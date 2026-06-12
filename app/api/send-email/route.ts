import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import nodemailer from "nodemailer";

async function getOrRefreshAccessToken(user: any): Promise<string> {
  const isExpired = new Date(user.googleTokenExpiry).getTime() - 60000 < Date.now();
  if (!isExpired) {
    return user.googleAccessToken;
  }

  if (!user.googleRefreshToken) {
    throw new Error("No refresh token available. Please log in again.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing OAuth client credentials in environment variables.");
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
    console.error("Failed to refresh OAuth token:", data);
    throw new Error(
      "Failed to refresh Google OAuth token: " + (data.error_description || data.error)
    );
  }

  const { db } = await connectToDatabase();
  const newAccessToken = data.access_token;
  const newExpiry = new Date(Date.now() + data.expires_in * 1000);

  const updateFields: any = {
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

    if (resumePdf instanceof File && resumePdf.size > 0 && resumePdf.type !== "application/pdf") {
      return NextResponse.json({ error: "Resume attachment must be a PDF file." }, { status: 400 });
    }

    // Refresh access token if expired
    let accessToken: string;
    try {
      accessToken = await getOrRefreshAccessToken(user);
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Failed to authenticate with Google." }, { status: 401 });
    }

    // Generate MIME-compliant raw RFC822 email format
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

    // Base64URL-encode raw email message
    const encodedMessage = Buffer.from(rawMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send via Gmail REST API
    const sendResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedMessage,
        }),
      }
    );

    const sendResult = await sendResponse.json();
    if (!sendResponse.ok) {
      console.error("Gmail Send API error:", sendResult);
      return NextResponse.json(
        { error: sendResult.error?.message || "Failed to send email via Gmail API." },
        { status: 500 }
      );
    }

    // Optionally save sent email details into the applications collection
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
  } catch (err: any) {
    console.error("POST /api/send-email error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
