import { NextResponse } from "next/server";
import { destroySession } from "@/lib/session";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Logout route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
