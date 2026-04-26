import { NextRequest, NextResponse } from "next/server";
import { getCurrentWeather } from "@/lib/weather";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "37.5665");
    const lng = parseFloat(searchParams.get("lng") || "126.9780");

    const weather = await getCurrentWeather(lat, lng);
    return NextResponse.json(weather);
  } catch (error) {
    console.error("Weather fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather" },
      { status: 500 }
    );
  }
}
