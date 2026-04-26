import { prisma } from "@/lib/prisma";
import type { WeatherData } from "@/lib/weather";
import { extractSubcategory } from "@/lib/utils";

// 비/흐림 날씨에 맞는 카테고리 키워드 (국물류)
const RAINY_KEYWORDS = [
  "탕", "찌개", "국밥", "라멘", "국물", "해장국", "순대국",
  "설렁탕", "짬뽕", "우동", "칼국수", "수제비", "전골",
];

// 더운 날씨에 맞는 카테고리 키워드
const HOT_KEYWORDS = ["냉면", "샐러드", "콩국수", "물냉면", "비빔냉면"];

// 점심시간에 제외할 카테고리 키워드 (호프/바/주점류)
const LUNCH_EXCLUDED_KEYWORDS = [
  "호프", "바", "주점", "술집", "포차", "이자카야", "맥주",
  "bar", "pub", "beer",
];

function matchesKeywords(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.toLowerCase().includes(kw.toLowerCase()));
}

/**
 * 시간대별 카테고리 제외 여부
 * 점심(11~14): 호프/바/주점 제외
 * 그 외: 제외 없음
 */
export function shouldExcludeByTimeCategory(
  categoryName: string,
  hour: number
): boolean {
  // 점심 시간대: 호프/바/주점 제외
  if (hour >= 11 && hour < 14) {
    return matchesKeywords(categoryName, LUNCH_EXCLUDED_KEYWORDS);
  }
  return false;
}

/**
 * 극단 날씨 시 거리 기반 제외
 * 폭우/뇌우: 도보 15분(1200m) 이상 제외
 */
export function shouldExcludeByExtremeWeather(
  distanceM: number,
  weather: WeatherData | null
): boolean {
  if (!weather) return false;
  if (weather.main === "Thunderstorm") return distanceM > 1200;
  if (weather.main === "Rain") {
    // 폭우(heavy rain) 조건: 설명에 "폭우" 포함이거나 강수량이 높을 때
    const desc = weather.description || "";
    if (desc.includes("폭우") || desc.includes("heavy")) return distanceM > 1200;
  }
  return false;
}

export interface PersonalizationContext {
  eatenSubcategories: Set<string>;
  rightSwipeCounts: Map<string, number>;
  weather: WeatherData | null;
  ignoreMealHistory: boolean;
}

export async function buildPersonalizationContext(
  userId: string,
  weather: WeatherData | null,
  ignoreMealHistory: boolean
): Promise<PersonalizationContext> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [mealRecords, swipeLogs] = await Promise.all([
    prisma.mealRecord.findMany({
      where: { userId, eatenAt: { gte: oneWeekAgo } },
      select: { category: true },
    }),
    prisma.swipeLog.findMany({
      where: { userId, direction: "right" },
      select: { category: true },
    }),
  ]);

  const eatenSubcategories = new Set(mealRecords.map((r) => r.category));

  const rightSwipeCounts = new Map<string, number>();
  for (const log of swipeLogs) {
    rightSwipeCounts.set(
      log.category,
      (rightSwipeCounts.get(log.category) ?? 0) + 1
    );
  }

  return { eatenSubcategories, rightSwipeCounts, weather, ignoreMealHistory };
}

export function scoreRestaurant(
  restaurant: { category_name: string; category_group_name: string },
  ctx: PersonalizationContext
): number {
  let score = 100;
  const catName = restaurant.category_name || "";
  const subcategory =
    extractSubcategory(catName) || restaurant.category_group_name;

  // 1. 스와이프 가중치: 오른쪽 스와이프 수 × 20% (최대 5회 = +100%)
  const swipeCount = ctx.rightSwipeCounts.get(subcategory) ?? 0;
  score += Math.min(swipeCount, 5) * 20;

  // 2. 날씨 보너스 +30%
  if (ctx.weather) {
    const { temp, main } = ctx.weather;
    if (main === "Rain" || main === "Drizzle" || main === "Clouds") {
      if (matchesKeywords(catName, RAINY_KEYWORDS)) score += 30;
    }
    if (temp >= 28) {
      if (matchesKeywords(catName, HOT_KEYWORDS)) score += 30;
    }
  }

  // 3. 식사 이력 패널티 (이번 주 먹은 카테고리 → 후순위)
  if (!ctx.ignoreMealHistory && ctx.eatenSubcategories.has(subcategory)) {
    score -= 200;
  }

  return score;
}

export function applyPersonalization<
  T extends {
    category_name: string;
    category_group_name: string;
    distance?: string;
  }
>(restaurants: T[], ctx: PersonalizationContext): T[] {
  return [...restaurants].sort((a, b) => {
    const sa = scoreRestaurant(a, ctx);
    const sb = scoreRestaurant(b, ctx);
    if (sa !== sb) return sb - sa;
    // 동점이면 거리 가까운 순
    return parseInt(a.distance || "0") - parseInt(b.distance || "0");
  });
}
