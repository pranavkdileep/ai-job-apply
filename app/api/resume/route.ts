import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ resume: user.resume || "" });
  } catch (err) {
    console.error("GET /api/resume error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { resume } = await req.json();
    if (typeof resume !== "string") {
      return NextResponse.json({ error: "Invalid resume content" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { resume, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/resume error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
