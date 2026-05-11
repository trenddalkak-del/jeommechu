"use client";

import { useCallback, useEffect, useState } from "react";
import { getUserId } from "@/lib/user";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { parseCategory, generateHashtags } from "@/lib/utils";

interface FavoriteItem {
  id: string;
  createdAt: string;
  restaurant: {
    id: string;
    kakaoPlaceId: string;
    name: string;
    category: string;
    lat?: number;
    lng?: number;
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  한식: "🍲",
  일식: "🍣",
  중식: "🥢",
  양식: "🍝",
  패스트푸드: "🍔",
  카페: "☕",
  분식: "🥚",
  치킨: "🍗",
  피자: "🍕",
  술집: "🍺",
};

const CATEGORY_GRADIENT: Record<string, [string, string]> = {
  한식: ["#FFEDE3", "#FFD4BD"],
  일식: ["#E3EDFF", "#BDD4FF"],
  중식: ["#FFE3E3", "#FFBDBD"],
  양식: ["#E3FFE9", "#BDFFD0"],
  패스트푸드: ["#FFF8E3", "#FFE8BD"],
  카페: ["#FFF3E3", "#FFE0BD"],
  분식: ["#FFE3F5", "#FFBDE8"],
  치킨: ["#FFEDE3", "#FFD9BD"],
  피자: ["#FFE8E3", "#FFCABD"],
  술집: ["#EDE3FF", "#D4BDFF"],
};

function getCategoryEmoji(category: string): string {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (category.includes(key)) return emoji;
  }
  return "🍽️";
}

function getCategoryGradientColors(category: string): [string, string] {
  for (const [key, colors] of Object.entries(CATEGORY_GRADIENT)) {
    if (category.includes(key)) return colors;
  }
  return ["#FFE8E0", "#FFD0BD"];
}

// ─────────────────────────────────────────────
// Card component
// ─────────────────────────────────────────────
function FavoriteCard({
  fav,
  onClick,
}: {
  fav: FavoriteItem;
  onClick: () => void;
}) {
  const { badge } = parseCategory(fav.restaurant.category);
  const emoji = getCategoryEmoji(fav.restaurant.category);
  const [from, to] = getCategoryGradientColors(fav.restaurant.category);

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className="w-full rounded-2xl overflow-hidden shadow-sm bg-white text-left"
    >
      <div
        className="relative w-full"
        style={{
          aspectRatio: "3/4",
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-5xl select-none">
          {emoji}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.1) 45%, transparent 60%)",
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-bold text-[13px] leading-snug line-clamp-2 drop-shadow">
            {fav.restaurant.name}
          </p>
        </div>
      </div>
      <div className="px-3 py-2">
        <span className="text-xs bg-orange-50 text-[#FF6B35] px-2 py-0.5 rounded-full font-medium">
          {badge}
        </span>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────
// Detail view
// ─────────────────────────────────────────────
function FavoriteDetail({
  fav,
  onBack,
  onUnfavorited,
}: {
  fav: FavoriteItem;
  onBack: () => void;
  onUnfavorited: () => void;
}) {
  const [isMealSaved, setIsMealSaved] = useState(false);
  const [mealLoading, setMealLoading] = useState(false);

  const { badge } = parseCategory(fav.restaurant.category);
  const hashtags = generateHashtags(fav.restaurant.category, undefined);
  const emoji = getCategoryEmoji(fav.restaurant.category);
  const [from, to] = getCategoryGradientColors(fav.restaurant.category);

  const lat = fav.restaurant.lat ?? 0;
  const lng = fav.restaurant.lng ?? 0;
  // y=lat, x=lng — matching result-screen.tsx convention
  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(fav.restaurant.name)},${lat},${lng}`;
  const naverMapUrl = `https://map.naver.com/v5/directions/-/${lat},${lng},${encodeURIComponent(fav.restaurant.name)},-/walk`;

  const removeFavorite = async () => {
    await fetch(
      `/api/favorites?userId=${getUserId()}&kakaoPlaceId=${encodeURIComponent(fav.restaurant.kakaoPlaceId)}`,
      { method: "DELETE" }
    ).catch(console.error);
    onUnfavorited();
  };

  const saveMealRecord = useCallback(async () => {
    if (mealLoading || isMealSaved) return;
    setMealLoading(true);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          restaurant: {
            id: fav.restaurant.kakaoPlaceId,
            place_name: fav.restaurant.name,
            category_group_name: fav.restaurant.category,
            category_name: fav.restaurant.category,
            x: String(lng),
            y: String(lat),
          },
          category: badge,
        }),
      });
      if (!res.ok) throw new Error("meal save failed");
      setIsMealSaved(true);
    } catch {
      // noop
    } finally {
      setMealLoading(false);
    }
  }, [badge, isMealSaved, mealLoading, fav, lat, lng]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-gray-50 pb-24"
    >
      {/* Big photo area — 3:4 */}
      <div
        className="relative w-full"
        style={{
          aspectRatio: "3/4",
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-8xl select-none">
          {emoji}
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 35%, transparent 55%)",
          }}
        />
        {/* Back button — top left */}
        <button
          onClick={onBack}
          className="absolute top-12 left-4 z-20 w-11 h-11 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center transition-transform active:scale-90"
          aria-label="뒤로가기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        {/* Heart (unfavorite) button — top right */}
        <button
          onClick={removeFavorite}
          className="absolute top-12 right-4 z-20 w-11 h-11 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center transition-transform active:scale-90"
          aria-label="즐겨찾기 해제"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="#FF6B35"
            stroke="#FF6B35"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 4px rgba(255,107,53,0.6))" }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </button>
        {/* Restaurant name — bottom overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <h2 className="text-[28px] font-bold text-white leading-tight">
            {fav.restaurant.name}
          </h2>
        </div>
      </div>

      {/* Content below photo */}
      <div className="px-5 pt-5 flex flex-col gap-5">
        {/* Category badge + hashtags */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm bg-[#FF6B35] text-white px-3 py-1 rounded-full font-medium">
            {badge}
          </span>
          {hashtags.map((tag, i) => (
            <span key={i} className="text-sm text-gray-500">
              #{tag}
            </span>
          ))}
        </div>

        {/* Map buttons */}
        <div className="flex gap-3">
          <a
            href={kakaoMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            카카오맵으로 보기
          </a>
          <a
            href={naverMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 rounded-xl bg-[#03C75A] text-white font-semibold text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            네이버맵으로 보기
          </a>
        </div>

        {/* Eat button */}
        <button
          onClick={saveMealRecord}
          disabled={mealLoading || isMealSaved}
          className={`w-full h-12 rounded-xl font-semibold text-sm transition-colors disabled:opacity-70 ${
            isMealSaved
              ? "bg-orange-100 text-[#FF6B35]"
              : "bg-[#FF6B35] text-white hover:opacity-90"
          }`}
        >
          {mealLoading ? "저장 중..." : isMealSaved ? "기록 완료 ✅" : "이거 먹었어요 🍽️"}
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FavoriteItem | null>(null);

  useEffect(() => {
    fetch(`/api/favorites?userId=${getUserId()}`)
      .then((r) => r.json())
      .then((data) => {
        setFavorites(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUnfavorited = useCallback(() => {
    if (!selected) return;
    setFavorites((prev) =>
      prev.filter(
        (f) => f.restaurant.kakaoPlaceId !== selected.restaurant.kakaoPlaceId
      )
    );
    setSelected(null);
  }, [selected]);

  return (
    <main className="min-h-screen bg-gray-50 pb-24 relative">
      <AnimatePresence mode="wait">
        {selected ? (
          <FavoriteDetail
            key="detail"
            fav={selected}
            onBack={() => setSelected(null)}
            onUnfavorited={handleUnfavorited}
          />
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="px-5 pt-12 pb-4">
              <h1 className="text-2xl font-bold text-gray-900">즐겨찾기</h1>
              <p className="text-sm text-gray-400 mt-1">자주 가는 식당을 모아보세요</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                불러오는 중...
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#D1D5DB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                <p className="text-gray-400 text-sm">즐겨찾기한 식당이 없어요</p>
                <p className="text-gray-300 text-xs">
                  결과 화면에서 하트를 눌러 추가해보세요
                </p>
              </div>
            ) : (
              <div className="px-4 grid grid-cols-2 gap-3">
                <AnimatePresence initial={false}>
                  {favorites.map((fav) => (
                    <motion.div
                      key={fav.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.15 },
                      }}
                    >
                      <FavoriteCard fav={fav} onClick={() => setSelected(fav)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}
