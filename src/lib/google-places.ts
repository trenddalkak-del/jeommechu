const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_BASE = "https://places.googleapis.com/v1";

// Google Places types considered food/restaurant-related
const FOOD_RELATED_TYPES = new Set([
  "restaurant", "food", "meal_delivery", "meal_takeaway",
  "cafe", "bakery", "bar", "night_club",
  "korean_restaurant", "chinese_restaurant", "japanese_restaurant",
  "italian_restaurant", "thai_restaurant", "vietnamese_restaurant",
  "indian_restaurant", "mexican_restaurant", "american_restaurant",
  "french_restaurant", "mediterranean_restaurant", "middle_eastern_restaurant",
  "seafood_restaurant", "steak_house", "sushi_restaurant",
  "ramen_restaurant", "barbecue_restaurant", "brunch_restaurant",
  "hamburger_restaurant", "pizza_restaurant", "sandwich_shop",
  "vegan_restaurant", "vegetarian_restaurant", "fast_food_restaurant",
  "ice_cream_shop", "coffee_shop",
]);

interface PlacesPhoto {
  name: string; // "places/{place_id}/photos/{photo_id}"
  widthPx: number;
  heightPx: number;
}

interface PlacesSearchResult {
  places?: Array<{
    id: string;
    displayName?: { text: string; languageCode: string };
    photos?: PlacesPhoto[];
    currentOpeningHours?: {
      openNow?: boolean;
    };
    types?: string[];
  }>;
}

export interface PlaceInfo {
  photoUrl: string | null;    // first/best photo URL (backward compat)
  photoUrlThumb: string | null; // thumbnail URL (maxWidthPx=400)
  photoUrls: string[];         // all candidate URLs, landscape-first
  openNow?: boolean;           // undefined = no info available
  types?: string[];            // Google Places types for hashtags
}

/**
 * Check if a place's types indicate it's a food/restaurant establishment.
 */
function isFoodPlace(types?: string[]): boolean {
  if (!types) return false;
  return types.some((t) => FOOD_RELATED_TYPES.has(t));
}

/**
 * Get photo, current open status, and types for a restaurant using Places API (New).
 * Uses locationBias from Kakao coordinates for accurate matching.
 * Removed includedType:"restaurant" which was causing many Korean restaurants to be excluded.
 */
async function getPlaceInfo(
  name: string,
  address: string,
  lat?: number,
  lng?: number
): Promise<PlaceInfo> {
  try {
    const textQuery = `${name} ${address}`;

    // Build request body: no includedType to avoid excluding valid restaurants
    const requestBody: Record<string, unknown> = {
      textQuery,
      languageCode: "ko",
      maxResultCount: 3,
    };

    // Add location bias if coordinates are available (from Kakao)
    if (lat && lng) {
      requestBody.locationBias = {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 200.0,
        },
      };
    }

    const searchRes = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.photos,places.currentOpeningHours,places.types",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    if (!searchRes.ok) {
      console.log(`[GooglePlaces] ${name}: API error ${searchRes.status}`);
      return { photoUrl: null, photoUrlThumb: null, photoUrls: [] };
    }

    const searchData: PlacesSearchResult = await searchRes.json();
    const allPlaces = searchData.places;
    if (!allPlaces || allPlaces.length === 0) {
      console.log(`[GooglePlaces] ${name}: no search results for query "${textQuery}"`);
      return { photoUrl: null, photoUrlThumb: null, photoUrls: [] };
    }

    // Pick the best food-related place from results (since we removed includedType filter)
    const foodPlace = allPlaces.find((p) => isFoodPlace(p.types));
    const place = foodPlace || allPlaces[0]; // fallback to first result if no food place found

    const matchedName = place.displayName?.text || "unknown";
    const isFood = isFoodPlace(place.types);
    console.log(
      `[GooglePlaces] ${name}: matched "${matchedName}" (id=${place.id}, isFood=${isFood}, types=${place.types?.join(",") || "none"})`
    );

    // If the best match isn't food-related at all (e.g., a street or area), skip it
    if (!isFood && !foodPlace) {
      console.log(`[GooglePlaces] ${name}: matched non-food place "${matchedName}" -> skipping`);
      return { photoUrl: null, photoUrlThumb: null, photoUrls: [], openNow: undefined, types: place.types };
    }

    // Extract open status (undefined if field not present)
    const openNow = place.currentOpeningHours?.openNow;

    // Extract types for hashtags
    const types = place.types;

    // Log raw photos array for debugging
    const photos = place.photos;
    console.log(`[GooglePlaces] ${name}: ${photos?.length ?? 0} photos`, photos?.map(p => ({
      name: p.name,
      w: p.widthPx,
      h: p.heightPx,
      isLandscape: p.widthPx >= p.heightPx,
    })));

    if (!photos || photos.length === 0) {
      console.log(`[GooglePlaces] ${name}: no photos`);
      return { photoUrl: null, photoUrlThumb: null, photoUrls: [], openNow, types };
    }

    // Sort: landscape (width >= height) first, then portrait
    const landscape = photos.filter((p) => p.widthPx >= p.heightPx);
    const portrait = photos.filter((p) => p.widthPx < p.heightPx);
    const sorted = [...landscape, ...portrait];

    // Build URL list for all photos (landscape-first)
    const photoUrls = sorted.map(
      (p) => `/api/photo/${p.name}?maxWidthPx=800`
    );
    const photoUrl = photoUrls[0] ?? null;
    const photoUrlThumb = sorted[0] ? `/api/photo/${sorted[0].name}?maxWidthPx=400` : null;

    console.log(`[GooglePlaces] ${name}: photo_url ${photoUrl ? "OK" : "null"}, ${photoUrls.length} URLs (${landscape.length} landscape)`);

    return { photoUrl, photoUrlThumb, photoUrls, openNow, types };
  } catch (err) {
    console.log(`[GooglePlaces] ${name}: exception`, err);
    return { photoUrl: null, photoUrlThumb: null, photoUrls: [] };
  }
}

/**
 * Batch fetch photo + open status + types for multiple restaurants.
 * Returns Map<place_name, PlaceInfo>
 */
export async function batchGetPhotos(
  restaurants: Array<{
    place_name: string;
    road_address_name?: string;
    address_name?: string;
    x?: string;  // longitude from Kakao
    y?: string;  // latitude from Kakao
  }>
): Promise<Map<string, PlaceInfo>> {
  const infoMap = new Map<string, PlaceInfo>();

  const results = await Promise.allSettled(
    restaurants.map(async (r) => {
      const address = r.road_address_name || r.address_name || "";
      const lat = r.y ? parseFloat(r.y) : undefined;
      const lng = r.x ? parseFloat(r.x) : undefined;
      const info = await getPlaceInfo(r.place_name, address, lat, lng);
      return { name: r.place_name, info };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      infoMap.set(result.value.name, result.value.info);
    }
  }

  // Summary log
  const total = results.length;
  const withPhoto = Array.from(infoMap.values()).filter((v) => v.photoUrls.length > 0).length;
  console.log(`[GooglePlaces] batch done: ${withPhoto}/${total} with photos, ${total - withPhoto} without`);

  return infoMap;
}
