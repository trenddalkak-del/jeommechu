const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY!;
const KAKAO_BASE_URL = "https://dapi.kakao.com/v2/local";

export interface KakaoPlace {
  id: string;
  place_name: string;
  category_group_code: string;
  category_group_name: string;
  category_name: string;
  x: string;
  y: string;
  distance: string;
  place_url: string;
  phone: string;
  address_name: string;
  road_address_name: string;
}

interface KakaoSearchResponse {
  documents: KakaoPlace[];
  meta: {
    total_count: number;
    pageable_count: number;
    is_end: boolean;
  };
}

export async function searchRestaurants(params: {
  lat: number;
  lng: number;
  radius?: number;
  query?: string;
  page?: number;
  size?: number;
}): Promise<KakaoSearchResponse> {
  const { lat, lng, radius = 10000, query = "맛집", page = 1, size = 15 } = params;

  const url = new URL(`${KAKAO_BASE_URL}/search/keyword.json`);
  url.searchParams.set("query", query);
  url.searchParams.set("y", String(lat));
  url.searchParams.set("x", String(lng));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("category_group_code", "FD6");
  url.searchParams.set("sort", "accuracy");
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Kakao API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function searchByCategory(params: {
  lat: number;
  lng: number;
  radius?: number;
  page?: number;
  size?: number;
}): Promise<KakaoSearchResponse> {
  const { lat, lng, radius = 10000, page = 1, size = 15 } = params;

  const url = new URL(`${KAKAO_BASE_URL}/search/category.json`);
  url.searchParams.set("category_group_code", "FD6");
  url.searchParams.set("y", String(lat));
  url.searchParams.set("x", String(lng));
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("sort", "distance");
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`Kakao API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
