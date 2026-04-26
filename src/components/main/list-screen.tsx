"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { Restaurant, WeatherInfo } from "@/app/main/page";
import { getCategoryImage } from "@/lib/category-images";

const weatherEmoji: Record<string, string> = {
  Clear: "☀️", Clouds: "☁️", Rain: "🌧️", Drizzle: "🌦️", Snow: "❄️", Thunderstorm: "⛈️",
};

const DISTANCE_OPTIONS = [
  { label: "5분", value: 5, radius: 400 },
  { label: "10분", value: 10, radius: 800 },
  { label: "15분", value: 15, radius: 1200 },
  { label: "20분", value: 20, radius: 1600 },
];

function getNextDistance(current: number): number | null {
  const idx = DISTANCE_OPTIONS.findIndex((o) => o.value === current);
  if (idx === -1 || idx >= DISTANCE_OPTIONS.length - 1) return null;
  return DISTANCE_OPTIONS[idx + 1].value;
}

export default function ListScreen({
  restaurants,
  weather,
  fetchError,
  onStartSwipe,
  onRetry,
  onIgnoreMealHistory,
  distanceMin = 10,
  totalFound,
}: {
  restaurants: Restaurant[];
  weather: WeatherInfo | null;
  fetchError?: string | null;
  onStartSwipe: () => void;
  onRetry?: () => void;
  onIgnoreMealHistory?: () => void;
  distanceMin?: number;
  totalFound?: number | null;
}) {
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDistancePicker, setShowDistancePicker] = useState(false);
  const [selectedDistance, setSelectedDistance] = useState(distanceMin);

  // Sync selectedDistance when prop changes
  useEffect(() => {
    setSelectedDistance(distanceMin);
  }, [distanceMin]);

  // Read saved distance preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("onboarding");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.distanceMin) setSelectedDistance(data.distanceMin);
    }
  }, []);

  // Show toast when fetchError arrives
  useEffect(() => {
    if (fetchError) {
      setToastMsg(fetchError);
      setToastVisible(true);
      const timer = setTimeout(() => setToastVisible(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [fetchError]);

  const handleDistanceChange = (value: number) => {
    setSelectedDistance(value);
    const stored = localStorage.getItem("onboarding");
    const data = stored ? JSON.parse(stored) : {};
    localStorage.setItem("onboarding", JSON.stringify({ ...data, distanceMin: value }));
    setShowDistancePicker(false);
    onRetry?.();
  };

  const isEmpty = restaurants.length === 0 && !fetchError;
  const isError = !!fetchError;

  // Insufficient stores warning: shown when < 10 results and there's a next distance option
  const nextDistance = getNextDistance(selectedDistance);
  const showInsufficientWarning =
    !isError &&
    !isEmpty &&
    totalFound !== null &&
    totalFound !== undefined &&
    totalFound < 10 &&
    nextDistance !== null;

  const radiusLabel = DISTANCE_OPTIONS.find((o) => o.value === selectedDistance)?.label || `${selectedDistance}분`;
  const radiusM = (selectedDistance || 10) * 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-52 bg-white"
    >
      {/* Toast */}
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2"
          >
            <span className="text-base">⚠️</span>
            <span className="flex-1">{toastMsg}</span>
            <button onClick={() => setToastVisible(false)} className="text-white/60 hover:text-white ml-2 text-base">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Distance picker modal */}
      <AnimatePresence>
        {showDistancePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 flex items-end"
            onClick={() => setShowDistancePicker(false)}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="w-full bg-white rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1 text-center">검색 거리 변경</h3>
              <p className="text-gray-400 text-sm mb-5 text-center">도보 기준으로 선택해 주세요</p>
              <div className="grid grid-cols-4 gap-3 mb-2">
                {DISTANCE_OPTIONS.map((opt) => {
                  const selected = selectedDistance === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleDistanceChange(opt.value)}
                      className="rounded-xl p-4 text-center transition-colors border"
                      style={{
                        backgroundColor: selected ? "#FFF7F3" : "#fff",
                        borderColor: selected ? "#FF6B35" : "#E5E5E5",
                        color: selected ? "#FF6B35" : "#374151",
                      }}
                    >
                      <span className="text-base font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-gray-900"
        >
          오늘의 점메추
        </motion.h1>
        {weather && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 mt-2">
            <span className="text-lg">{weatherEmoji[weather.main] || "🌤️"}</span>
            <span className="text-gray-500 text-sm">{weather.temp.toFixed(0)}°C · {weather.description}</span>
          </motion.div>
        )}
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={() => setShowDistancePicker(true)}
            className="text-gray-400 text-xs hover:text-[#FF6B35] transition-colors"
          >
            반경 {radiusM}m ({radiusLabel}) · 가까운 순 ›
          </button>
          {onIgnoreMealHistory && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={onIgnoreMealHistory}
              className="text-xs text-[#FF6B35] underline underline-offset-2"
            >
              다시 보기
            </motion.button>
          )}
        </div>
      </div>

      {/* Insufficient stores warning */}
      {showInsufficientWarning && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mb-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3"
        >
          <p className="text-amber-700 text-sm leading-snug flex-1">
            {radiusLabel} 거리 가게는 {totalFound}개밖에 없어요.{" "}
            {nextDistance}분 거리도 괜찮아요?
          </p>
          <button
            onClick={() => handleDistanceChange(nextDistance!)}
            className="shrink-0 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-xl transition-colors"
          >
            {nextDistance}분으로 재검색
          </button>
        </motion.div>
      )}

      {/* Empty / Error state */}
      {(isEmpty || isError) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center justify-center px-8 py-20 text-center"
        >
          <div className="text-6xl mb-5">{isError ? "😓" : "🔍"}</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {isError ? "불러오기 실패" : "주변에 식당을 찾지 못했어요"}
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {isError
              ? "네트워크 상태를 확인하거나\n잠시 후 다시 시도해 주세요."
              : "검색 반경을 넓히거나\n다시 시도해 보세요."}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onRetry?.()}
              className="w-full h-12 rounded-2xl text-sm font-bold text-white bg-[#FF6B35] hover:bg-[#e55e2e] transition-colors shadow-md shadow-[#FF6B35]/20"
            >
              다시 시도하기
            </motion.button>
            {!isError && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowDistancePicker(true)}
                className="w-full h-12 rounded-2xl text-sm font-semibold text-[#FF6B35] bg-[#FF6B35]/10 hover:bg-[#FF6B35]/15 transition-colors"
              >
                거리 설정 변경하기
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Restaurant list */}
      {!isEmpty && !isError && (
        <div className="px-5 space-y-3">
          {restaurants.map((r, i) => {
            const imgSrc = r.photo_url || getCategoryImage(r.category_name || r.category_group_name);
            const distMin = r.distance ? Math.round(parseInt(r.distance) / 80) : null;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex items-stretch">
                  {/* Text content */}
                  <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                    <h3 className="text-gray-900 font-semibold text-base truncate">
                      {r.place_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {r.category_group_name && (
                        <span className="text-xs bg-[#FF6B35]/10 text-[#FF6B35] px-2 py-0.5 rounded-full font-medium">
                          {r.category_group_name}
                        </span>
                      )}
                      {/* Open / Closed badge */}
                      {r.open_now === true && (
                        <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium border border-green-100">
                          영업중
                        </span>
                      )}
                      {r.open_now === undefined && (
                        <span className="text-xs bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-medium border border-gray-100">
                          정보없음
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {r.distance ? `${r.distance}m` : ""}
                        {distMin !== null ? ` · ${distMin}분` : ""}
                      </span>
                    </div>
                    {r.road_address_name && (
                      <p className="text-gray-400 text-xs mt-1.5 truncate">
                        {r.road_address_name}
                      </p>
                    )}
                  </div>
                  {/* Square thumbnail */}
                  <div className="w-24 h-24 shrink-0 m-3 rounded-xl overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={r.place_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Fixed bottom button */}
      {restaurants.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent pt-16 z-40">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartSwipe}
            className="w-full h-14 rounded-2xl text-base font-bold text-white bg-[#FF6B35] hover:bg-[#e55e2e] transition-colors shadow-lg shadow-[#FF6B35]/20"
          >
            스와이프로 고르기
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
