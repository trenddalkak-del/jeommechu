"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/user";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";

interface FavoriteItem {
  id: string;
  createdAt: string;
  restaurant: {
    id: string;
    kakaoPlaceId: string;
    name: string;
    category: string;
  };
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
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
          <p className="text-gray-300 text-xs">결과 화면에서 하트를 눌러 추가해보세요</p>
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
                className="bg-white rounded-2xl px-4 py-4 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🍽️</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{fav.restaurant.name}</p>
                    <p className="text-sm text-[#FF6B35] font-medium">{fav.restaurant.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(fav.restaurant.kakaoPlaceId)}
                  className="ml-3 flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors"
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
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <BottomNav />
    </main>
  );
}
