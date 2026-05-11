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

  const lat = fav.restaurant.lat ?? 0;
  const lng = fav.restaurant.lng ?? 0;
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
      {/* Header with back button */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center transition-transform active:scale-90"
          aria-label="뒤로가기"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">식당 상세</h1>
      </div>

      <div className="px-5 flex flex-col gap-5">
        {/* Restaurant name */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{fav.restaurant.name}</h2>
            <p className="text-sm text-[#FF6B35] font-medium mt-1">{fav.restaurant.category}</p>
          </div>
          {/* Heart (unfavorite) button */}
          <button
            onClick={removeFavorite}
            className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center transition-transform active:scale-90 flex-shrink-0"
            aria-label="즐겨찾기 해제"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="#FF6B35"
              stroke="#FF6B35"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
        </div>

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

  const removeFavorite = async (kakaoPlaceId: string) => {
    setFavorites((prev) => prev.filter((f) => f.restaurant.kakaoPlaceId !== kakaoPlaceId));
    await fetch(`/api/favorites?userId=${getUserId()}&kakaoPlaceId=${encodeURIComponent(kakaoPlaceId)}`, {
      method: "DELETE",
    }).catch(console.error);
  };

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
            key="list"
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
              <ul className="px-4 flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {favorites.map((fav) => (
                    <motion.li
                      key={fav.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                      className="bg-white rounded-2xl px-4 py-4 shadow-sm"
                    >
                      <button
                        onClick={() => setSelected(fav)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                              <span className="text-xl">🍽️</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{fav.restaurant.name}</p>
                              <p className="text-sm text-[#FF6B35] font-medium">{fav.restaurant.category}</p>
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center justify-between mt-3">
                        <button
                          onClick={() => removeFavorite(fav.restaurant.kakaoPlaceId)}
                          className="text-sm text-gray-400 hover:text-red-400 transition-colors flex items-center gap-1"
                          aria-label="즐겨찾기 해제"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="#FF6B35"
                            stroke="#FF6B35"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                          </svg>
                          <span>해제</span>
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </main>
  );
}
