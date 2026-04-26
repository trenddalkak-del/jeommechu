import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
