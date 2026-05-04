import { NextRequest, NextResponse } from "next/server";
import { searchByCategory } from "@/lib/kakao";
import { getCurrentWeather } from "@/lib/weather";
import { batchGetPhotos } from "@/lib/google-places";
import {
  buildPersonalizationContext,
  applyPersonalization,
  shouldExcludeByTimeCategory,
  shouldExcludeByExtremeWeather,
} from "@/lib/personalization";

// Categories to always exclude (cafes, desserts)
const EXCLUDED_CATEGORIES = ["카페", "베이커리", "디저트", "제과", "커피"];

function shouldExclude(categoryName: string): boolean {
  return EXCLUDED_CATEGORIES.some((exc) => categoryName.includes(exc));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "37.5665");
    const lng = parseFloat(searchParams.get("lng") || "126.9780");
    const distanceMin = parseInt(searchParams.get("distanceMin") || "10");
    const allergiesParam = searchParams.get("allergies") || "";
    const allergies = allergiesParam
      ? allergiesParam.split(",").map((a) => a.trim()).filter(Boolean)
      : [];
    const userId = searchParams.get("userId") || "";
    const ignoreMealHistory =
      searchParams.get("ignoreMealHistory") === "true";

    // Convert walking minutes to meters (5min=400m, 10min=800m, 15min=1200m, 20min=1600m)
    const radius = distanceMin * 80;

    // Current server time (Korea Standard Time = UTC+9)
    const nowHour = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    ).getHours();

    const [weather, result] = await Promise.all([
      getCurrentWeather(lat, lng),
      searchByCategory({ lat, lng, radius, size: 15 }),
    ]);

    // Base filtering: exclude cafes/bakeries, allergies, time-based categories
    const baseFiltered = result.documents.filter((r) => {
      const cat = r.category_name || r.category_group_name || "";
      if (shouldExclude(cat)) return false;
      if (allergies.length > 0) {
        const catLower = cat.toLowerCase();
        if (allergies.some((a) => catLower.includes(a.toLowerCase()))) return false;
      }
      // Time-based: exclude bars/pubs during lunch
      if (shouldExcludeByTimeCategory(cat, nowHour)) return false;
      // Extreme weather: exclude far places during heavy rain/thunderstorm
      if (shouldExcludeByExtremeWeather(parseInt(r.distance || "0"), weather)) return false;
      return true;
    }).sort((a, b) => parseInt(a.distance || "0") - parseInt(b.distance || "0"));

    // Fetch Google Places data (photo + open status + types)
    const placeInfoMap = await batchGetPhotos(baseFiltered);

    // Attach photo_url, open_now, and google_types; filter out confirmed-closed places
    const withPlaceInfo = baseFiltered
      .map((r) => {
        const info = placeInfoMap.get(r.place_name);
        return {
          ...r,
          photo_url: info?.photoUrl || null,
          photo_urls: info?.photoUrls || [],
          open_now: info?.openNow, // undefined = no info
          google_types: info?.types, // for hashtags
        };
      })
      .filter((r) => r.open_now !== false); // exclude confirmed closed

    // Total after all filters (before capping at 10) — used for "not enough stores" UI
    const totalFound = withPlaceInfo.length;

    const capped = withPlaceInfo.slice(0, 10);

    // Build personalization context and re-rank
    let personalized = capped;
    try {
      const ctx = await buildPersonalizationContext(
        userId,
        weather,
        ignoreMealHistory
      );
      personalized = applyPersonalization(capped, ctx);
    } catch (err) {
      console.warn("Personalization skipped:", err);
    }

    return NextResponse.json({
      weather,
      restaurants: personalized,
      totalFound,
      distanceMin,
    });
  } catch (error) {
    console.error("Restaurant search error:", error);
    return NextResponse.json(
      { error: "Failed to fetch restaurants" },
      { status: 500 }
    );
  }
}
