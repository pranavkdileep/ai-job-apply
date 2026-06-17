import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/api/send-email", "/api/generate", "/api/account"];
const protectedPostRoutes = ["/api/resume"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  const needsAuth =
    protectedRoutes.some((r) => pathname.startsWith(r)) ||
    (method === "POST" && protectedPostRoutes.some((r) => pathname.startsWith(r)));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get("session_id")?.value;
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
