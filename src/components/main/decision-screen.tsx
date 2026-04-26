"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { Restaurant } from "@/app/main/page";

export default function DecisionScreen({
  liked,
  onChoose,
}: {
  liked: Restaurant[];
  onChoose: (restaurant: Restaurant) => void;
}) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showManual, setShowManual] = useState(false);

  const startRoulette = useCallback(() => {
    if (liked.length === 0) return;
    setIsSpinning(true);
    setShowManual(false);

    const total = liked.length;
    const finalIndex = Math.floor(Math.random() * total);
    let tick = 0;
    const totalTicks = 20 + Math.floor(Math.random() * 10);

    const interval = setInterval(() => {
      setHighlightIndex(tick % total);
      tick++;
      if (tick >= totalTicks) {
        clearInterval(interval);
        setHighlightIndex(finalIndex);
        setTimeout(() => {
          setIsSpinning(false);
          onChoose(liked[finalIndex]);
        }, 800);
      }
    }, 80 + tick * 8);
  }, [liked, onChoose]);

  if (liked.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white"
      >
        <div className="text-5xl mb-6">😅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          선택한 식당이 없어요
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          모든 식당을 넘겨버렸네요... 다시 해볼까요?
        </p>
        <button
          onClick={() => window.location.reload()}
          className="h-12 px-8 rounded-xl text-base font-semibold text-white bg-[#FF6B35]"
        >
          처음부터 다시
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen pb-32 bg-white"
    >
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {liked.length}곳이 마음에 들었어요!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          직접 고르거나 랜덤으로 돌려보세요
        </p>
      </div>

      <div className="px-6 space-y-2">
        {liked.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: highlightIndex === i ? 1.03 : 1,
            }}
            transition={{ delay: showManual ? 0 : i * 0.05, duration: 0.2 }}
            onClick={() => !isSpinning && onChoose(r)}
            className="rounded-2xl p-4 border-2 cursor-pointer transition-all"
            style={{
              backgroundColor: highlightIndex === i ? "#FFF7F3" : "#fff",
              borderColor: highlightIndex === i ? "#FF6B35" : "#f0f0f0",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {getCategoryEmoji(r.category_group_name)}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 font-semibold truncate">
                  {r.place_name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {r.category_group_name && (
                    <span className="text-xs text-[#FF6B35]">
                      {r.category_group_name}
                    </span>
                  )}
                  {r.distance && (
                    <span className="text-xs text-gray-400">{r.distance}m</span>
                  )}
                </div>
              </div>
              {!isSpinning && (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
                  <path d="M7.5 5L12.5 10L7.5 15" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-16">
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowManual(true)}
            disabled={isSpinning}
            className="flex-1 h-14 rounded-2xl text-base font-bold text-gray-700 bg-white border border-gray-200 hover:border-[#FF6B35]/50 transition-colors disabled:opacity-50 shadow-sm"
          >
            직접 고를래
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startRoulette}
            disabled={isSpinning}
            className="flex-1 h-14 rounded-2xl text-base font-bold text-white bg-[#FF6B35] hover:bg-[#e55e2e] transition-colors shadow-lg shadow-[#FF6B35]/20 disabled:opacity-50"
          >
            {isSpinning ? "돌리는 중..." : "랜덤으로 돌리기"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function getCategoryEmoji(category: string): string {
  if (!category) return "🍽️";
  if (category.includes("한식")) return "🍚";
  if (category.includes("중식") || category.includes("중국")) return "🥟";
  if (category.includes("일식") || category.includes("일본")) return "🍣";
  if (category.includes("양식")) return "🍝";
  if (category.includes("치킨")) return "🍗";
  if (category.includes("피자")) return "🍕";
  if (category.includes("버거") || category.includes("햄버거")) return "🍔";
  if (category.includes("분식")) return "🍜";
  if (category.includes("카페") || category.includes("디저트")) return "☕";
  return "🍽️";
}
