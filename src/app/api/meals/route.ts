import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, restaurant, category } = body;

    if (!userId || !restaurant?.id) {
      return NextResponse.json({ error: "userId and restaurant required" }, { status: 400 });
    }

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
      data: { userId, restaurantId: dbRestaurant.id, category },
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
    const days = parseInt(searchParams.get("days") || "7");
    const limit = parseInt(searchParams.get("limit") || "0");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const records = await prisma.mealRecord.findMany({
      where: {
        userId,
        eatenAt: { gte: since },
      },
      include: { restaurant: true },
      orderBy: { eatenAt: "desc" },
      take: limit > 0 ? limit : undefined,
    });

    return NextResponse.json({ meals: records });
  } catch (error) {
    console.error("Meal records fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal records" },
      { status: 500 }
    );
  }
}
