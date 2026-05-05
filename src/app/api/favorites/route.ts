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
      const restaurant = await prisma.restaurant.findUnique({
        where: { kakaoPlaceId },
      });
      if (!restaurant) {
        return NextResponse.json({ favorited: false });
      }
      const fav = await prisma.favorite.findUnique({
        where: { userId_restaurantId: { userId, restaurantId: restaurant.id } },
      });
      return NextResponse.json({ favorited: !!fav });
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: { restaurant: true },
      orderBy: { createdAt: "desc" },
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

    // userId가 users 테이블에 없으면 FK 위반으로 실패 → 먼저 upsert로 보장
    await prisma.user.upsert({
      where: { id: userId },
      create: { id: userId },
      update: {},
    });

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

    const favorite = await prisma.favorite.upsert({
      where: { userId_restaurantId: { userId, restaurantId: dbRestaurant.id } },
      update: {},
      create: { userId, restaurantId: dbRestaurant.id },
    });

    return NextResponse.json({ ...favorite, restaurant: dbRestaurant });
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

    const restaurant = await prisma.restaurant.findUnique({
      where: { kakaoPlaceId },
    });

    if (!restaurant) {
      return NextResponse.json({ success: true });
    }

    await prisma.favorite.deleteMany({
      where: { userId, restaurantId: restaurant.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Favorite delete error:", error);
    return NextResponse.json({ error: "Failed to delete favorite" }, { status: 500 });
  }
}
