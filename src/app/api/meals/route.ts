import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, restaurant, category, eatenAt } = body;

    if (!userId || !restaurant?.id || !category) {
      return NextResponse.json({ error: "userId, restaurant, category required" }, { status: 400 });
    }

    await prisma.users.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

    const dbRestaurant = await prisma.restaurants.upsert({
      where: { kakao_place_id: restaurant.id },
      update: {
        name: restaurant.place_name,
        category: restaurant.category_group_name || restaurant.category_name || "",
      },
      create: {
        id: crypto.randomUUID(),
        kakao_place_id: restaurant.id,
        name: restaurant.place_name,
        category: restaurant.category_group_name || restaurant.category_name || "",
        lat: parseFloat(restaurant.y || "0"),
        lng: parseFloat(restaurant.x || "0"),
      },
    });

    const record = await prisma.meal_records.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        restaurant_id: dbRestaurant.id,
        restaurant_name: restaurant.place_name || dbRestaurant.name,
        category,
        photo_url: restaurant.photo_url || restaurant.photo_urls?.[0] || null,
        eaten_at: eatenAt ? new Date(eatenAt) : new Date(),
      },
      include: { restaurants: true },
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

export async function PATCH(request: NextRequest) {
  try {
    const { id, restaurantName } = await request.json();
    if (!id || !restaurantName) {
      return NextResponse.json({ error: "id and restaurantName required" }, { status: 400 });
    }
    const updated = await prisma.meal_records.update({
      where: { id },
      data: { restaurant_name: restaurantName },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Meal update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
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

    // KST offset: UTC+9 = 9 * 60 * 60 * 1000 ms
    const KST_OFFSET = 9 * 60 * 60 * 1000;

    let eatenAtFilter: { gte?: Date; lt?: Date } = {};
    if (month) {
      const [yearStr, monthStr] = month.split("-");
      const year = Number(yearStr);
      const monthIndex = Number(monthStr) - 1;
      if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || monthIndex < 0 || monthIndex > 11) {
        return NextResponse.json({ error: "invalid month format (YYYY-MM)" }, { status: 400 });
      }
      // Use KST-based range: KST midnight = UTC midnight - 9h
      const startKST = new Date(Date.UTC(year, monthIndex, 1) - KST_OFFSET);
      const endKST = new Date(Date.UTC(year, monthIndex + 1, 1) - KST_OFFSET);
      eatenAtFilter = { gte: startKST, lt: endKST };
    } else {
      const since = new Date();
      since.setDate(since.getDate() - days);
      eatenAtFilter = { gte: since };
    }

    const records = await prisma.meal_records.findMany({
      where: {
        user_id: userId,
        eaten_at: eatenAtFilter,
      },
      include: { restaurants: true },
      orderBy: { eaten_at: "desc" },
      take: limit > 0 ? limit : undefined,
    });

    // Transform snake_case Prisma fields to camelCase for the frontend
    const meals = records.map((r) => ({
      id: r.id,
      category: r.category,
      eatenAt: r.eaten_at,
      restaurantName: r.restaurant_name,
      photoUrl: r.photo_url,
      restaurant: r.restaurants
        ? {
            name: r.restaurants.name,
            category: r.restaurants.category,
            kakaoPlaceId: r.restaurants.kakao_place_id,
          }
        : null,
    }));

    return NextResponse.json({ meals, month: month ?? null });
  } catch (error) {
    console.error("Meal records fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch meal records" },
      { status: 500 }
    );
  }
}
