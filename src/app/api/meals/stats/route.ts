import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }
    if (!month) {
      return NextResponse.json({ error: "month required (YYYY-MM)" }, { status: 400 });
    }

    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
      return NextResponse.json({ error: "invalid month format (YYYY-MM)" }, { status: 400 });
    }

    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 1);

    const records = await prisma.meal_records.findMany({
      where: { user_id: userId, eaten_at: { gte: start, lt: end } },
      select: { category: true },
    });

    const statsMap = new Map<string, number>();
    for (const record of records) {
      const key = record.category || "기타";
      statsMap.set(key, (statsMap.get(key) ?? 0) + 1);
    }

    const stats = Array.from(statsMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ month, stats, total: records.length });
  } catch (error) {
    console.error("Meal stats fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch meal stats" }, { status: 500 });
  }
}
