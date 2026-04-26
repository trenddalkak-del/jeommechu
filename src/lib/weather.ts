const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!;
const BASE_URL = "https://api.openweathermap.org/data/2.5";

export interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  main: string;
}

interface OpenWeatherResponse {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

export async function getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = new URL(`${BASE_URL}/weather`);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("appid", OPENWEATHER_API_KEY);
  url.searchParams.set("units", "metric");
  url.searchParams.set("lang", "kr");

  const res = await fetch(url.toString(), {
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    throw new Error(`OpenWeather API error: ${res.status} ${res.statusText}`);
  }

  const data: OpenWeatherResponse = await res.json();

  return {
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    main: data.weather[0].main,
  };
}

export function getWeatherKeywords(weather: WeatherData): string[] {
  const { temp, main } = weather;

  if (main === "Rain" || main === "Drizzle") {
    return ["전 막걸리", "칼국수", "수제비", "부대찌개", "라멘"];
  }
  if (main === "Snow") {
    return ["어묵탕", "떡볶이", "호떡", "붕어빵", "찜닭"];
  }
  if (temp >= 30) {
    return ["냉면", "콩국수", "초밥", "샐러드", "아이스크림"];
  }
  if (temp >= 20) {
    return ["맛집", "한식", "양식", "일식", "중식"];
  }
  if (temp >= 10) {
    return ["국밥", "찌개", "된장찌개", "김치찌개", "삼겹살"];
  }
  return ["순대국", "설렁탕", "갈비탕", "곰탕", "감자탕"];
}
