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
// Radius expansion steps (meters) for auto-expand when results < 10
const EXPAND_RADII = [800, 1200, 1600, 2000];

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
    const explicitRadius = searchParams.get("radius");
    const initialRadius = explicitRadius ? parseInt(explicitRadius) : distanceMin * 80;

    // Current server time (Korea Standard Time = UTC+9)
    const nowHour = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
    ).getHours();

    const sortParam = (searchParams.get("sort") || "distance") as "distance" | "accuracy";

    // Fetch weather once
    const weather = await getCurrentWeather(lat, lng);

    // Build list of radii to try: start with initialRadius, then expand
    const radiiToTry = [initialRadius, ...EXPAND_RADII.filter((r) => r > initialRadius)];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let withPlaceInfo: any[] = [];

    for (const tryRadius of radiiToTry) {
      const result = await searchByCategory({ lat, lng, radius: tryRadius, size: 15, sort: sortParam });

      const baseFiltered = result.documents.filter((r) => {
        const cat = r.category_name || r.category_group_name || "";
        if (shouldExclude(cat)) return false;
        if (allergies.length > 0) {
          const catLower = cat.toLowerCase();
          if (allergies.some((a) => catLower.includes(a.toLowerCase()))) return false;
        }
        if (shouldExcludeByTimeCategory(cat, nowHour)) return false;
        if (shouldExcludeByExtremeWeather(parseInt(r.distance || "0"), weather)) return false;
        return true;
      }).sort((a, b) => parseInt(a.distance || "0") - parseInt(b.distance || "0"));

      const placeInfoMap = await batchGetPhotos(baseFiltered);

      const filtered = baseFiltered
        .map((r) => {
          const info = placeInfoMap.get(r.place_name);
          return {
            ...r,
            photo_url: info?.photoUrl || null,
            photo_url_thumb: info?.photoUrlThumb || null,
            photo_urls: info?.photoUrls || [],
            open_now: info?.openNow,
            google_types: info?.types,
          };
        })
        .filter((r) => r.open_now !== false)
        .filter((r) => !!r.photo_url && r.photo_url.length > 0);

      withPlaceInfo = filtered;
      if (filtered.length >= 10) break;
    }

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
      totalFound: withPlaceInfo.length,
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
