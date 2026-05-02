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
