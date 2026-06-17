import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { rateLimit } from "@/lib/rateLimit";

const MAX_RESUME = 50_000;

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ resume: user.resume || "" });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`resume:${user._id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { resume } = await req.json();
    if (typeof resume !== "string") {
      return NextResponse.json({ error: "Invalid resume content" }, { status: 400 });
    }

    if (resume.length > MAX_RESUME) {
      return NextResponse.json(
        { error: `Resume is too long (max ${MAX_RESUME} characters).` },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { resume, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
