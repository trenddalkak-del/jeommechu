const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_BASE = "https://places.googleapis.com/v1";

interface PlacesPhoto {
  name: string; // "places/{place_id}/photos/{photo_id}"
  widthPx: number;
  heightPx: number;
}

interface PlacesSearchResult {
  places?: Array<{
    id: string;
    photos?: PlacesPhoto[];
    currentOpeningHours?: {
      openNow?: boolean;
    };
  }>;
}

export interface PlaceInfo {
  photoUrl: string | null;
  openNow?: boolean; // undefined = no info available
}

/**
 * Get photo and current open status for a restaurant using Places API (New).
 */
async function getPlaceInfo(
  name: string,
  address: string
): Promise<PlaceInfo> {
  try {
    const textQuery = `${name} ${address}`;

    const searchRes = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": API_KEY,
        "X-Goog-FieldMask": "places.id,places.photos,places.currentOpeningHours",
      },
      body: JSON.stringify({
        textQuery,
        includedType: "restaurant",
        maxResultCount: 1,
      }),
      next: { revalidate: 86400 },
    });

    if (!searchRes.ok) return { photoUrl: null };

    const searchData: PlacesSearchResult = await searchRes.json();
    const place = searchData.places?.[0];
    if (!place) return { photoUrl: null };

    // Extract open status (undefined if field not present)
    const openNow = place.currentOpeningHours?.openNow;

    // Pick best photo — prefer landscape (food/interior)
    const photos = place.photos;
    if (!photos || photos.length === 0) return { photoUrl: null, openNow };

    const landscape = photos.filter((p) => p.widthPx >= p.heightPx);
    const notTooPortrait = photos.filter((p) => p.heightPx <= p.widthPx * 1.3);
    const best = landscape[0] || notTooPortrait[0] || photos[0];

    const photoUrl = `${PLACES_BASE}/${best.name}/media?maxWidthPx=800&key=${API_KEY}`;
    return { photoUrl, openNow };
  } catch {
    return { photoUrl: null };
  }
}

/**
 * Batch fetch photo + open status for multiple restaurants.
 * Returns Map<place_name, PlaceInfo>
 */
export async function batchGetPhotos(
  restaurants: Array<{ place_name: string; road_address_name?: string; address_name?: string }>
): Promise<Map<string, PlaceInfo>> {
  const infoMap = new Map<string, PlaceInfo>();

  const results = await Promise.allSettled(
    restaurants.map(async (r) => {
      const address = r.road_address_name || r.address_name || "";
      const info = await getPlaceInfo(r.place_name, address);
      return { name: r.place_name, info };
    })
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      infoMap.set(result.value.name, result.value.info);
    }
  }

  return infoMap;
}
