import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

    return NextResponse.json({ userId });
  } catch (error) {
    console.error("User ensure error:", error);
    return NextResponse.json(
      { error: "Failed to ensure user" },
      { status: 500 }
    );
  }
}
