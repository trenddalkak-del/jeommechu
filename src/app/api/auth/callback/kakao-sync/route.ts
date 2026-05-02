import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { kakaoId, name, image, email } = await request.json();

    if (!kakaoId) {
      return NextResponse.json({ error: "kakaoId required" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { kakaoId },
      create: {
        id: crypto.randomUUID(),
        kakaoId,
        name: name || null,
        image: image || null,
        email: email || null,
      },
      update: {
        name: name || null,
        image: image || null,
        email: email || null,
      },
    });

    return NextResponse.json({ userId: user.id, kakaoId: user.kakaoId });
  } catch (error) {
    console.error("Kakao sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
