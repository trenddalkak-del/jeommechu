export async function GET() {
  const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

  // 1. API 키 존재 확인
  console.log("API_KEY exists:", !!API_KEY);

  // 2. 테스트 검색
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY!,
      "X-Goog-FieldMask": "places.displayName,places.photos",
    },
    body: JSON.stringify({
      textQuery: "굽네치킨 망원",
      languageCode: "ko",
    }),
    cache: "no-store",
  });

  const data = await res.json();

  return Response.json({
    apiKeyExists: !!API_KEY,
    status: res.status,
    photoCount: data.places?.[0]?.photos?.length ?? 0,
    firstPhoto: data.places?.[0]?.photos?.[0] ?? null,
    rawResponse: data,
  });
}
