import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const kakaoPlaceId = searchParams.get("kakaoPlaceId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  try {
    if (kakaoPlaceId) {
      const restaurant = await prisma.restaurants.findUnique({
        where: { kakao_place_id: kakaoPlaceId },
      });
      if (!restaurant) {
        return NextResponse.json({ favorited: false });
      }
      const fav = await prisma.favorites.findUnique({
        where: { user_id_restaurant_id: { user_id: userId, restaurant_id: restaurant.id } },
      });
      return NextResponse.json({ favorited: !!fav });
    }

    const favorites = await prisma.favorites.findMany({
      where: { user_id: userId },
      include: { restaurants: true },
      orderBy: { created_at: "desc" },
    });
    return NextResponse.json(favorites);
  } catch (error) {
    console.error("Favorites fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, restaurant } = body;

    if (!userId || !restaurant?.id) {
      return NextResponse.json({ error: "userId and restaurant required" }, { status: 400 });
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

    const favorite = await prisma.favorites.upsert({
      where: { user_id_restaurant_id: { user_id: userId, restaurant_id: dbRestaurant.id } },
      update: {},
      create: { id: crypto.randomUUID(), user_id: userId, restaurant_id: dbRestaurant.id },
    });

    return NextResponse.json({ ...favorite, restaurants: dbRestaurant });
  } catch (error) {
    console.error("Favorite create error:", error);
    return NextResponse.json({ error: "Failed to create favorite" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const kakaoPlaceId = searchParams.get("kakaoPlaceId");

    if (!userId || !kakaoPlaceId) {
      return NextResponse.json(
        { error: "userId and kakaoPlaceId required" },
        { status: 400 }
      );
    }

    const restaurant = await prisma.restaurants.findUnique({
      where: { kakao_place_id: kakaoPlaceId },
    });

    if (!restaurant) {
      return NextResponse.json({ success: true });
    }

    await prisma.favorites.deleteMany({
      where: { user_id: userId, restaurant_id: restaurant.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Favorite delete error:", error);
    return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
  }
}
