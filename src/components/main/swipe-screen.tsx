"use client";

import { useState, useRef, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import type { Restaurant } from "@/app/main/page";
import { extractSubcategory, parseCategory, generateHashtags, calculateWalkingMinutes } from "@/lib/utils";
import { getUserId } from "@/lib/user";
import SafeImage from "./safe-image";

const SWIPE_THRESHOLD = 100;

export default function SwipeScreen({
  restaurants,
  onComplete,
}: {
  restaurants: Restaurant[];
  onComplete: (liked: Restaurant[]) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Restaurant[]>([]);
  const [exitX, setExitX] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const cardStartTime = useRef(Date.now());

  const logCardDuration = useCallback((restaurant: Restaurant) => {
    const duration = Date.now() - cardStartTime.current;
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: getUserId(),
        eventType: "card_view_duration",
        metadata: { restaurantId: restaurant.id, name: restaurant.place_name, durationMs: duration },
      }),
    }).catch(console.error);

    if (duration > 3000) {
      fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          eventType: "swipe_hesitation",
          metadata: { restaurantId: restaurant.id, durationMs: duration },
        }),
      }).catch(() => {});
    }
  }, []);

  const handleSwipe = useCallback(
    (direction: "left" | "right") => {
      const restaurant = restaurants[currentIndex];
      if (!restaurant) return;

      setShowHint(false);
      logCardDuration(restaurant);

      fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: getUserId(),
          restaurantId: restaurant.id,
          direction,
          category: extractSubcategory(restaurant.category_name || restaurant.category_group_name),
        }),
      }).catch(console.error);

      if (direction === "right") {
        setLiked((prev) => [...prev, restaurant]);
      }

      setExitX(direction === "right" ? 300 : -300);

      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= restaurants.length) {
          const finalLiked = direction === "right" ? [...liked, restaurant] : liked;
          onComplete(finalLiked);
        } else {
          setCurrentIndex(nextIndex);
          cardStartTime.current = Date.now();
          setExitX(0);
        }
      }, 200);
    },
    [currentIndex, restaurants, liked, onComplete, logCardDuration]
  );

  const current = restaurants[currentIndex];
  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col bg-gray-50"
    >
      {/* Progress */}
      <div className="px-5 pt-8 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">{currentIndex + 1} / {restaurants.length}</span>
          <span className="text-[#FF6B35] text-sm font-medium">❤️ {liked.length}개 선택</span>
        </div>
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#FF6B35] rounded-full"
            animate={{ width: `${((currentIndex + 1) / restaurants.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card area — 3:4 aspect ratio */}
      <div className="flex-1 flex items-center justify-center px-5 py-2">
        <div className="relative w-full max-w-sm" style={{ aspectRatio: "3/4" }}>
          <AnimatePresence>
            <SwipeCard key={current.id} restaurant={current} onSwipe={handleSwipe} exitX={exitX} />
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="px-5 pb-8 flex flex-col items-center gap-2">
        {/* Swipe hint */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center gap-6"
            >
              <span className="w-16 text-center text-sm text-gray-400">← 싫어요</span>
              <span className="w-16 text-center text-sm text-orange-400">땡겨요 →</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <div className="flex justify-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe("left")}
            className="w-16 h-16 rounded-full bg-white border-2 border-red-200 flex items-center justify-center text-2xl text-red-400 hover:border-red-400 hover:text-red-500 transition-colors shadow-sm"
          >
            ✕
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSwipe("right")}
            className="w-16 h-16 rounded-full bg-white border-2 border-green-200 flex items-center justify-center text-2xl text-green-500 hover:border-green-400 hover:text-green-600 transition-colors shadow-sm"
          >
            ♥
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function SwipeCard({
  restaurant,
  onSwipe,
  exitX,
}: {
  restaurant: Restaurant;
  onSwipe: (direction: "left" | "right") => void;
  exitX: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const distMin = calculateWalkingMinutes(restaurant.distance);
  
  // 카테고리 파싱
  const { badge } = parseCategory(restaurant.category_name || restaurant.category_group_name);
  const hashtags = generateHashtags(
    restaurant.category_name || restaurant.category_group_name,
    restaurant.google_types
  );

  return (
    <motion.div
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
        else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
      }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={{ x: exitX, opacity: 0, transition: { duration: 0.2 } }}
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
    >
      <div className="relative h-full w-full rounded-2xl overflow-hidden shadow-xl">
        {/* Full cover photo with skeleton + error fallback */}
        <SafeImage
          src={restaurant.photo_url}
          srcs={restaurant.photo_urls}
          alt={restaurant.place_name}
          
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />

        {/* Gradient overlay — bottom 50% */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 35%, transparent 50%)",
          }}
        />

        {/* Swipe overlays */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute inset-0 bg-green-500/15 rounded-2xl flex items-center justify-center z-10 pointer-events-none"
        >
          <div className="border-4 border-green-500 text-green-500 font-black text-3xl px-6 py-2 rounded-xl rotate-[-15deg] bg-white/80">
            당겨요
          </div>
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute inset-0 bg-red-500/15 rounded-2xl flex items-center justify-center z-10 pointer-events-none"
        >
          <div className="border-4 border-red-500 text-red-500 font-black text-3xl px-6 py-2 rounded-xl rotate-[15deg] bg-white/80">
            안당겨요
          </div>
        </motion.div>

        {/* Text content at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-[5]">
          {/* 식당명 */}
          <h2 className="text-2xl font-bold text-white leading-tight mb-2">
            {restaurant.place_name}
          </h2>
          
          {/* 카테고리 배지 + 해시태그 */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs bg-[#FF6B35] text-white px-2.5 py-1 rounded-full font-medium">
              {badge}
            </span>
            {hashtags.map((tag, i) => (
              <span key={i} className="text-xs text-white/90">
                #{tag}
              </span>
            ))}
          </div>
          
          {/* 거리 정보 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-white/80">
              {restaurant.distance}m{distMin !== null ? ` · 도보 ${distMin}분` : ""}
            </span>
          </div>
          
          {/* 주소 */}
          {restaurant.road_address_name && (
            <p className="text-white/70 text-xs">{restaurant.road_address_name}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
