import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { message: "카카오 로그인은 NextAuth를 통해 처리됩니다." },
    { status: 410 }
  );
}
