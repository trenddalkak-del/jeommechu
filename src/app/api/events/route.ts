import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, eventType, metadata } = body;

    const log = await prisma.event_logs.create({
      data: { id: crypto.randomUUID(), user_id: userId, event_type: eventType, metadata: metadata ? JSON.stringify(metadata) : "{}" },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Event log error:", error);
    return NextResponse.json(
      { error: "Failed to log event" },
      { status: 500 }
    );
  }
}
