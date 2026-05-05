"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/user";
import BottomNav from "@/components/BottomNav";
import SafeImage from "@/components/main/safe-image";

interface MealRecord {
  id: string;
  category: string;
  eatenAt: string;
  restaurantName?: string;
  photoUrl?: string | null;
  restaurant: {
    name: string;
    category: string;
    kakaoPlaceId?: string;
  } | null;
}

interface MealStatsItem {
  category: string;
  count: number;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function ymd(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [stats, setStats] = useState<MealStatsItem[]>([]);
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const currentMonth = monthKey(month);
    const userId = getUserId();
    setLoading(true);
    setStatsLoading(true);
    fetch(`/api/meals?userId=${userId}&month=${currentMonth}`)
      .then((r) => r.json())
      .then((data) => {
        setRecords(Array.isArray(data?.meals) ? data.meals : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    fetch(`/api/meals/stats?userId=${userId}&month=${currentMonth}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(Array.isArray(data?.stats) ? data.stats : []);
        setStatsLoading(false);
      })
      .catch(() => setStatsLoading(false));
  }, [month]);

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const startWeekday = monthStart.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const slots: Array<Date | null> = [];
  for (let i = 0; i < startWeekday; i += 1) slots.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    slots.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (slots.length % 7 !== 0) slots.push(null);

  const recordMap = new Map<string, MealRecord[]>();
  for (const record of records) {
    const key = ymd(new Date(record.eatenAt));
    const existing = recordMap.get(key) ?? [];
    existing.push(record);
    recordMap.set(key, existing);
  }
  const selectedMeals = recordMap.get(selectedDate) ?? [];
  const now = new Date();
  const monthLabel = month.toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">식사 기록</h1>
        <p className="text-sm text-gray-400 mt-1">월별 캘린더로 식사를 확인해보세요</p>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
              className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="이전 달"
            >
              ‹
            </button>
            <p className="font-semibold text-gray-900">{monthLabel}</p>
            <button
              onClick={() => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600"
              aria-label="다음 달"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 text-xs text-gray-400 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <p key={d} className="text-center py-1">{d}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {slots.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="h-12" />;
              const key = ymd(date);
              const hasMeal = (recordMap.get(key)?.length ?? 0) > 0;
              const isSelected = key === selectedDate;
              const isToday = key === ymd(now);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(key)}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center relative ${
                    isSelected ? "bg-orange-100" : "hover:bg-gray-100"
                  }`}
                >
                  <span className={`text-sm ${isToday ? "text-[#FF6B35] font-bold" : "text-gray-700"}`}>
                    {date.getDate()}
                  </span>
                  {hasMeal && <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] absolute bottom-1.5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-2">이번 달 카테고리 통계</p>
          {statsLoading ? (
            <p className="text-sm text-gray-400">불러오는 중...</p>
          ) : stats.length === 0 ? (
            <p className="text-sm text-gray-400">기록이 없어요</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stats.map((s) => (
                <span key={s.category} className="text-sm bg-orange-50 text-[#FF6B35] px-3 py-1 rounded-full font-medium">
                  {s.category} {s.count}회
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-4 mt-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">
          {new Date(selectedDate).toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short",
          })} 기록
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          불러오는 중...
        </div>
      ) : selectedMeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2">
          <p className="text-gray-400 text-sm">선택한 날짜 기록이 없어요</p>
        </div>
      ) : (
        <ul className="px-4 flex flex-col gap-3">
          {selectedMeals.map((item) => (
            <li key={item.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3 items-center">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                <SafeImage
                  src={item.photoUrl ?? null}
                  alt={item.restaurant?.name ?? item.restaurantName ?? "식사 사진"}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {item.restaurant?.name ?? item.restaurantName ?? "식당"}
                </p>
                <p className="text-sm text-[#FF6B35] font-medium">
                  {item.category || item.restaurant?.category || "기타"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <BottomNav />
    </main>
  );
}
