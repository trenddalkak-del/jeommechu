import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, restaurantId, direction, category } = body;

    const log = await prisma.swipeLog.create({
      data: { userId, restaurantId, direction, category },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Swipe log error:", error);
    return NextResponse.json(
      { error: "Failed to log swipe" },
      { status: 500 }
    );
  }
}
