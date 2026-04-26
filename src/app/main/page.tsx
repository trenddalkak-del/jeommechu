"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/main/loading-screen";
import ListScreen from "@/components/main/list-screen";
import SwipeScreen from "@/components/main/swipe-screen";
import DecisionScreen from "@/components/main/decision-screen";
import ResultScreen from "@/components/main/result-screen";
import BottomNav from "@/components/BottomNav";
import { extractSubcategory } from "@/lib/utils";

export interface Restaurant {
  id: string;
  place_name: string;
  category_group_name: string;
  category_name: string;
  x: string;
  y: string;
  distance: string;
  place_url: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  photo_url: string | null;
  open_now?: boolean; // undefined = no info
}

export interface WeatherInfo {
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  main: string;
}

type Phase = "loading" | "list" | "swipe" | "decision" | "result";

export default function MainPage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [liked, setLiked] = useState<Restaurant[]>([]);
  const [chosen, setChosen] = useState<Restaurant | null>(null);
  const [lat, setLat] = useState(37.5665);
  const [lng, setLng] = useState(126.978);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [ignoreMealHistory, setIgnoreMealHistory] = useState(false);
  const [distanceMin, setDistanceMin] = useState(10);
  const [totalFound, setTotalFound] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("onboarding");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.lat) setLat(data.lat);
      if (data.lng) setLng(data.lng);
      if (data.distanceMin) setDistanceMin(data.distanceMin);
    }
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;

    const fetchData = async () => {
      setFetchError(null);
      try {
        let currentLat = lat;
        let currentLng = lng;
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          currentLat = pos.coords.latitude;
          currentLng = pos.coords.longitude;
          setLat(currentLat);
          setLng(currentLng);
        } catch {
          // Use stored/default location
        }

        // Read distanceMin fresh from localStorage at fetch time
        let currentDistanceMin = distanceMin;
        try {
          const stored = localStorage.getItem("onboarding");
          if (stored) {
            const data = JSON.parse(stored);
            if (data.distanceMin) {
              currentDistanceMin = data.distanceMin;
              setDistanceMin(data.distanceMin);
            }
          }
        } catch { /* ignore */ }

        const res = await fetch(
          `/api/restaurants?lat=${currentLat}&lng=${currentLng}&userId=local-user&ignoreMealHistory=${ignoreMealHistory}&distanceMin=${currentDistanceMin}`
        );

        if (!res.ok) {
          throw new Error(`서버 응답 오류 (${res.status})`);
        }

        const data = await res.json();

        if (data.error) throw new Error(data.error);

        setRestaurants(data.restaurants || []);
        setWeather(data.weather || null);
        setTotalFound(data.totalFound ?? null);
        setPhase("list");
      } catch (err) {
        console.error("Failed to load:", err);
        setFetchError(
          err instanceof Error
            ? err.message
            : "식당 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
        );
        setRestaurants([]);
        setPhase("list");
      }
    };

    fetchData();
  }, [phase, lat, lng, ignoreMealHistory, distanceMin]);

  const handleRetry = () => {
    setRestaurants([]);
    setWeather(null);
    setFetchError(null);
    setTotalFound(null);
    setPhase("loading");
  };

  const handleIgnoreMealHistory = () => {
    setIgnoreMealHistory(true);
    setRestaurants([]);
    setWeather(null);
    setFetchError(null);
    setTotalFound(null);
    setPhase("loading");
  };

  const handleSwipeComplete = (likedItems: Restaurant[]) => {
    setLiked(likedItems);
    setPhase("decision");
  };

  const handleChoose = (restaurant: Restaurant) => {
    setChosen(restaurant);
    fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: 'local-user',
        restaurant,
        category: extractSubcategory(restaurant.category_name || restaurant.category_group_name),
      }),
    }).catch(console.error);
    setPhase("result");
  };

  const showBottomNav = phase === "list" || phase === "result";

  return (
    <main className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {phase === "loading" && <LoadingScreen key="loading" />}
        {phase === "list" && (
          <ListScreen
            key="list"
            restaurants={restaurants}
            weather={weather}
            fetchError={fetchError}
            onStartSwipe={() => setPhase("swipe")}
            onRetry={handleRetry}
            onIgnoreMealHistory={ignoreMealHistory ? undefined : handleIgnoreMealHistory}
            distanceMin={distanceMin}
            totalFound={totalFound}
          />
        )}
        {phase === "swipe" && (
          <SwipeScreen
            key="swipe"
            restaurants={restaurants}
            onComplete={handleSwipeComplete}
          />
        )}
        {phase === "decision" && (
          <DecisionScreen
            key="decision"
            liked={liked}
            onChoose={handleChoose}
          />
        )}
        {phase === "result" && chosen && (
          <ResultScreen
            key="result"
            restaurant={chosen}
            weather={weather}
            onRestart={() => {
              setLiked([]);
              setChosen(null);
              setPhase("loading");
            }}
          />
        )}
      </AnimatePresence>
      {showBottomNav && <BottomNav />}
    </main>
  );
}
