import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { rateLimit } from "@/lib/rateLimit";

export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`account:${user._id}`, 3, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { db } = await connectToDatabase();
    const userId = user._id;

    await db.collection("sessions").deleteMany({ userId });
    await db.collection("applications").deleteMany({ userId });
    await db.collection("users").deleteOne({ _id: new ObjectId(userId) });

    const res = NextResponse.json({ success: true });
    res.cookies.set("session_id", "", { maxAge: 0, path: "/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
