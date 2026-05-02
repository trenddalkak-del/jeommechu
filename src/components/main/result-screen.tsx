"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserId } from "@/lib/user";
import { motion } from "framer-motion";
import type { Restaurant, WeatherInfo } from "@/app/main/page";
import SafeImage from "./safe-image";

function logEvent(eventType: string, metadata: Record<string, unknown>) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: getUserId(), eventType, metadata }),
  }).catch(() => {});
}

export default function ResultScreen({
  restaurant,
  weather,
  onRestart,
}: {
  restaurant: Restaurant;
  weather?: WeatherInfo | null;
  onRestart: () => void;
}) {
  const [showContent, setShowContent] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(true);
  const mountTimeRef = useRef(Date.now());
  const ignoredLoggedRef = useRef(false);
  const sparklePositions = useRef(
    Array.from({ length: 12 }).map(() => ({
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
    }))
  );

  const distanceMin = restaurant.distance
    ? Math.round(parseInt(restaurant.distance) / 80)
    : null;

  const kakaoMapUrl = `https://map.kakao.com/link/to/${encodeURIComponent(restaurant.place_name)},${restaurant.y},${restaurant.x}`;
  const naverMapUrl = `https://map.naver.com/v5/directions/-/${restaurant.y},${restaurant.x},${encodeURIComponent(restaurant.place_name)},-/walk`;

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Load favorite state
  useEffect(() => {
    fetch(`/api/favorites?userId=${getUserId()}&kakaoPlaceId=${encodeURIComponent(restaurant.id)}`)
      .then((r) => r.json())
      .then((data) => {
        setIsFavorited(!!data.favorited);
        setFavLoading(false);
      })
      .catch(() => setFavLoading(false));
  }, [restaurant.id]);

  const toggleFavorite = useCallback(async () => {
    const next = !isFavorited;
    setIsFavorited(next);
    try {
      if (next) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: getUserId(), restaurant }),
        });
      } else {
        await fetch(
          `/api/favorites?userId=${getUserId()}&kakaoPlaceId=${encodeURIComponent(restaurant.id)}`,
          { method: "DELETE" }
        );
      }
    } catch {
      setIsFavorited(!next);
    }
  }, [isFavorited, restaurant]);

  // result_ignored: 30초 내 이탈 감지
  useEffect(() => {
    const THRESHOLD_MS = 30_000;
    const check = () => {
      if (!ignoredLoggedRef.current && Date.now() - mountTimeRef.current < THRESHOLD_MS) {
        ignoredLoggedRef.current = true;
        logEvent("result_ignored", {
          restaurantId: restaurant.id,
          durationMs: Date.now() - mountTimeRef.current,
        });
      }
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") check();
    };
    window.addEventListener("beforeunload", check);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", check);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [restaurant.id]);

  // category_time_pattern: 요일 + 시간대 + 카테고리
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    logEvent("category_time_pattern", {
      dayOfWeek: now.getDay(),
      timeSlot: hour >= 11 && hour < 15 ? "lunch" : "dinner",
      category: restaurant.category_group_name,
    });
  }, [restaurant.id, restaurant.category_group_name]);

  // weather_choice: 날씨 + 카테고리
  useEffect(() => {
    if (!weather) return;
    logEvent("weather_choice", {
      weatherCondition: weather.main,
      temperature: weather.temp,
      category: restaurant.category_group_name,
    });
  }, [weather, restaurant.id, restaurant.category_group_name]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center p-6 relative overflow-hidden bg-gray-50 pt-12 pb-24"
    >
      {/* Spotlight background */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: 600,
            height: 600,
            background:
              "radial-gradient(circle, rgba(255,107,53,0.08) 0%, rgba(255,107,53,0.03) 40%, transparent 70%)",
          }}
        />
      </motion.div>

      {/* Sparkle particles */}
      {sparklePositions.current.map((pos, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
            x: pos.x,
            y: pos.y,
          }}
          transition={{ duration: 1.5, delay: 0.2 + i * 0.08, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-[#FF6B35]"
        />
      ))}

      <AnimatedContent show={showContent}>
        <div className="w-full max-w-sm flex flex-col items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="text-[#FF6B35] text-lg font-bold mb-4"
          >
            오늘의 점메추 ⭐⭐⭐⭐⭐
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full relative rounded-2xl overflow-hidden shadow-xl mb-6"
            style={{ aspectRatio: "3/4" }}
          >
            <SafeImage
              src={restaurant.photo_url}
              alt={restaurant.place_name}
              category={restaurant.category_name || restaurant.category_group_name}
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
            {/* Favorite button — top right */}
            {!favLoading && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 }}
                onClick={toggleFavorite}
                className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center transition-transform active:scale-90"
                aria-label={isFavorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={isFavorited ? "#FF6B35" : "none"}
                  stroke={isFavorited ? "#FF6B35" : "white"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: isFavorited ? "drop-shadow(0 0 4px rgba(255,107,53,0.6))" : undefined }}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </motion.button>
            )}
            {/* Text content at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-6 z-[5]">
              <h2 className="text-2xl font-bold text-white leading-tight">
                {restaurant.place_name}
              </h2>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex flex-col items-center gap-1 mb-6 text-center"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
              {restaurant.category_group_name && (
                <span className="text-sm text-[#FF6B35] font-medium">
                  {restaurant.category_group_name}
                </span>
              )}
              {distanceMin !== null && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-600 font-medium">
                    🚶 도보 {distanceMin}분
                  </span>
                </>
              )}
            </div>
            {restaurant.road_address_name && (
              <p className="text-gray-500 text-sm">
                {restaurant.road_address_name}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
            className="flex gap-3 w-full mb-6"
          >
            <a
              href={kakaoMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logEvent("detail_click", { restaurantId: restaurant.id, mapType: "kakao" })}
              className="flex-1 h-12 rounded-xl bg-[#FEE500] text-[#191919] font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              카카오맵으로 보기
            </a>
            <a
              href={naverMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logEvent("detail_click", { restaurantId: restaurant.id, mapType: "naver" })}
              className="flex-1 h-12 rounded-xl bg-[#03C75A] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              네이버맵으로 보기
            </a>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            onClick={onRestart}
            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors underline underline-offset-4"
          >
            다시 추천받기
          </motion.button>
        </div>
      </AnimatedContent>
    </motion.div>
  );
}

function AnimatedContent({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex justify-center"
    >
      {children}
    </motion.div>
  );
}
