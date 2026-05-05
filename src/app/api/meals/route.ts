import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, restaurant, category, eatenAt } = body;

    if (!userId || !restaurant?.id || !category) {
      return NextResponse.json({ error: "userId, restaurant, category required" }, { status: 400 });
    }

    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

    // Upsert restaurant so FK is valid
    const dbRestaurant = await prisma.restaurant.upsert({
      where: { kakaoPlaceId: restaurant.id },
      update: {
        name: restaurant.place_name,
        category: restaurant.category_group_name || restaurant.category_name || "",
      },
      create: {
        kakaoPlaceId: restaurant.id,
        name: restaurant.place_name,
        category: restaurant.category_group_name || restaurant.category_name || "",
        lat: parseFloat(restaurant.y || "0"),
        lng: parseFloat(restaurant.x || "0"),
      },
    });

    const record = await prisma.mealRecord.create({
      data: {
        userId,
        restaurantId: dbRestaurant.id,
        restaurantName: restaurant.place_name || dbRestaurant.name,
        category,
        photoUrl: restaurant.photo_url || restaurant.photo_urls?.[0] || null,
        eatenAt: eatenAt ? new Date(eatenAt) : new Date(),
      },
      include: { restaurant: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Meal record error:", error);
    return NextResponse.json(
      { error: "Failed to create meal record" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const month = searchParams.get("month");
    const days = parseInt(searchParams.get("days") || "7");
    const limit = parseInt(searchParams.get("limit") || "0");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    let eatenAtFilter: { gte?: Date; lt?: Date } = {};
    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return NextResponse.json({ error: "invalid month format (YYYY-MM)" }, { status: 400 });
      }
      const start = new Date(year, monthIndex, 1);
      const end = new Date(year, monthIndex + 1, 1);
      eatenAtFilter = { gte: start, lt: end };
    } else {
      const since = new Date();
      since.setDate(since.getDate() - days);
      eatenAtFilter = { gte: since };
    }

    const records = await prisma.mealRecord.findMany({
      where: {
        userId,
        eatenAt: eatenAtFilter,
      },
      include: { restaurant: true },
      orderBy: { eatenAt: "desc" },
      take: limit > 0 ? limit : undefined,
    });

    return NextResponse.json({ meals: records, month: month ?? null });
  } catch (error) {
    console.error("Meal records fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal records" },
      { status: 500 }
    );
  }
}
