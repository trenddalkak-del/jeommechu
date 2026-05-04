import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Kakao category_name (e.g. "음식점 > 한식 > 삼겹살") 에서
 * 두 번째 세그먼트("한식")를 추출합니다.
 */
export function extractSubcategory(categoryName: string): string {
  const parts = categoryName.split(" > ");
  if (parts.length >= 2) return parts[1].trim();
  return parts[0]?.trim() || "기타";
}

/**
 * Kakao category_name에서 메인 카테고리(배지용)와 해시태그 목록을 추출
 * 예: "음식점 > 한식 > 육류,고기 > 삼겹살" → { badge: "한식", hashtags: ["육류,고기", "삼겹살"] }
 */
export function parseCategory(categoryName: string): {
  badge: string;
  hashtags: string[];
} {
  const parts = categoryName.split(" > ").map((p) => p.trim());

  // 메인 카테고리 (두 번째 세그먼트)
  const badge = parts[1] || parts[0] || "음식점";

  // 해시태그: 3번째부터 마지막까지
  const hashtags = parts.slice(2).filter(Boolean);

  return { badge, hashtags };
}

/**
 * Google Places types를 해시태그로 변환
 */
export function typesToHashtags(types?: string[]): string[] {
  if (!types || types.length === 0) return [];

  const typeMap: Record<string, string> = {
    korean_restaurant: "한식",
    japanese_restaurant: "일식",
    chinese_restaurant: "중식",
    italian_restaurant: "이탈리안",
    mexican_restaurant: "멕시칸",
    thai_restaurant: "태국음식",
    vietnamese_restaurant: "베트남음식",
    indian_restaurant: "인도음식",
    american_restaurant: "양식",
    french_restaurant: "프렌치",
    barbecue: "바베큐",
    sushi: "초밥",
    ramen: "라멘",
    pizza: "피자",
    burger: "버거",
    cafe: "카페",
    bakery: "베이커리",
    bar: "바",
    pub: "펍",
    steak_house: "스테이크",
    seafood_restaurant: "해산물",
    vegetarian_restaurant: "채식",
    vegan_restaurant: "비건",
    noodle: "면요리",
    soup: "국물요리",
    buffet: "뷔페",
    fast_food: "패스트푸드",
    sandwich: "샌드위치",
    dessert: "디저트",
    ice_cream: "아이스크림",
    wine_bar: "와인바",
  };

  return types
    .map((t) => typeMap[t])
    .filter((t): t is string => Boolean(t));
}

/**
 * 카테고리와 Google types를 합쳐서 최대 3개 해시태그 반환
 */
export function generateHashtags(
  categoryName: string,
  googleTypes?: string[]
): string[] {
  const { hashtags: categoryHashtags } = parseCategory(categoryName);
  const googleHashtags = typesToHashtags(googleTypes);

  // 중복 제거하고 최대 3개
  const all = [...categoryHashtags, ...googleHashtags];
  const unique: string[] = [];
  for (const item of all) {
    if (!unique.includes(item)) {
      unique.push(item);
    }
  }

  return unique.slice(0, 3);
}

// 시간대별 기본 인사말
const TIME_GREETINGS: Record<string, string> = {
  morning: "좋은 아침!",
  lunch: "오늘의 점메추",
  dinner: "오늘 저녁은 뭐가 땡겨요?",
  latenight: "야식 타임!",
};

// 시간대별 이모지
const CATEGORY_EMOJI: Record<string, string> = {
  햄버거: "🍔",
  피자: "🍕",
  치킨: "🍗",
  한식: "🍚",
  일식: "🍣",
  중식: "🥡",
  양식: "🍝",
  분식: "🍜",
  카페: "☕",
  베이커리: "🥐",
  샐러드: "🥗",
  고기: "🥩",
  국밥: "🍲",
  라멘: "🍜",
  초밥: "🍣",
  파스타: "🍝",
  샌드위치: "🥪",
  도시락: "🍱",
  떡볶이: "🥘",
  족발: "🐷",
  보쌈: "🐽",
};

/**
 * 현재 시간대에 따른 인사말 반환
 */
export function getTimeGreeting(hour: number = new Date().getHours()): string {
  if (hour >= 6 && hour < 11) return TIME_GREETINGS.morning;
  if (hour >= 11 && hour < 17) return TIME_GREETINGS.lunch;
  if (hour >= 17 && hour < 21) return TIME_GREETINGS.dinner;
  return TIME_GREETINGS.latenight;
}

/**
 * 날씨에 따른 인사말 접미사 반환
 */
export function getWeatherSuffix(
  weatherMain?: string,
  temp?: number
): string {
  // 온도 기반 먼저 체크
  if (temp !== undefined) {
    if (temp >= 28) return "더운 날엔 시원한 거!";
    if (temp <= 5) return "추운 날엔 뜨끈한 국물!";
  }

  // 날씨 기반
  switch (weatherMain?.toLowerCase()) {
    case "clear":
      return "날씨가 좋네요 ☀️";
    case "rain":
    case "drizzle":
    case "snow":
      return "비가 오네요, 따뜻한 거 어때요? 🌧️";
    case "clouds":
      return "흐린 날엔 든든한 한 끼!";
    case "wind":
    case "mist":
      return "바람이 많이 부네요 🍃";
    default:
      return "날씨가 좋네요 ☀️";
  }
}

/**
 * 카테고리에 맞는 이모지 반환
 */
export function getCategoryEmoji(category: string): string {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (category.includes(key)) return emoji;
  }
  return "🍽️";
}

/**
 * 어제 먹은 카테고리로 인사말 생성
 */
export function getYesterdayGreeting(category: string): string {
  const emoji = getCategoryEmoji(category);
  return `어제는 ${category}를 먹었어요 ${emoji}`;
}

/**
 * 동적 인사말 생성
 * @param hour 현재 시간 (0-23)
 * @param weatherMain 날씨 메인 (Clear, Rain, Clouds 등)
 * @param temp 온도
 * @param yesterdayCategory 어제 먹은 카테고리 (없으면 null)
 * @returns 최종 인사말
 */
export function generateGreeting({
  hour = new Date().getHours(),
  weatherMain,
  temp,
  yesterdayCategory,
}: {
  hour?: number;
  weatherMain?: string;
  temp?: number;
  yesterdayCategory?: string | null;
}): string {
  const baseGreeting = getTimeGreeting(hour);

  // 어제 기록이 있으면 50% 확률로 표시
  if (yesterdayCategory && Math.random() < 0.5) {
    return `${baseGreeting}, ${getYesterdayGreeting(yesterdayCategory)}`;
  }

  // 날씨 정보가 있으면 날씨 기반 접미사
  if (weatherMain) {
    return `${baseGreeting}, ${getWeatherSuffix(weatherMain, temp)}`;
  }

  return baseGreeting;
}

export function calculateWalkingMinutes(distanceMeters: number | string | undefined | null): number | null {
  if (!distanceMeters) return null;
  const meters = typeof distanceMeters === "string" ? parseInt(distanceMeters, 10) : distanceMeters;
  if (isNaN(meters)) return null;
  return Math.max(1, Math.ceil(meters / 67));
}
