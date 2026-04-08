import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  SESSION_MAX_AGE_SEC,
  createToken,
  verifyCredentials,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { id, password } = await req.json();
    if (typeof id !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "아이디와 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    const user = verifyCredentials(id, password);
    if (!user) {
      return NextResponse.json(
        { error: "아이디 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const token = await createToken({
      id: user.id,
      role: user.role,
      exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
    });

    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SEC,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
