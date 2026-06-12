import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        picture: user.picture,
        hasResume: !!user.resume,
      },
    });
  } catch (err) {
    console.error("Session route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
