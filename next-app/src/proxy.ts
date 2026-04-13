import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE } from "@/lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and login API without auth
  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login");

  if (isPublic) {
    return NextResponse.next();
  }

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  const session = await verifyToken(token);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // Forward the user's group id so API routes can filter data
  // without re-parsing the cookie themselves.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-group-id", session.groupId || "");

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Protect every route except Next.js internals and static assets
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
