"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/user";
import BottomNav from "@/components/BottomNav";
import SafeImage from "@/components/main/safe-image";
import ProfileHeader from "@/components/history/profile-header";
import SettingsSheet from "@/components/history/settings-sheet";

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

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

export default function HistoryPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [stats, setStats] = useState<MealStatsItem[]>([]);
  const [latestMeal, setLatestMeal] = useState<MealRecord | null>(null);
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(ymd(new Date()));
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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

  useEffect(() => {
    const userId = getUserId();
    fetch(`/api/meals?userId=${userId}&days=365&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const meals = Array.isArray(data?.meals) ? data.meals : [];
        setLatestMeal(meals[0] ?? null);
      })
      .catch(() => {});
  }, []);

  const handleEditSave = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await fetch("/api/meals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, restaurantName: editName.trim() }),
      });
      setLatestMeal((prev) =>
        prev && prev.id === editingId ? { ...prev, restaurantName: editName.trim() } : prev
      );
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editingId ? { ...r, restaurantName: editName.trim() } : r
        )
      );
      setEditingId(null);
    } catch {
      setEditingId(null);
    }
  };

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

  const selectedDateLabel = new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const latestMealName =
    latestMeal?.restaurantName ||
    (latestMeal as unknown as { restaurant_name?: string })?.restaurant_name ||
    "식당";

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <ProfileHeader onSettingsOpen={() => setSettingsOpen(true)} />

      {/* 캘린더 */}
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

      {/* 날짜별 기록 */}
      <div className="px-4 mt-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">
          {selectedDateLabel} 기록
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
          불러오는 중...
        </div>
      ) : selectedMeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 gap-2">
          <p className="text-gray-400 text-sm">선택한 날짜 기록이 없어요</p>
        </div>
      ) : (
        <ul className="px-4 flex flex-col gap-3">
          {selectedMeals.map((item) => {
            const name =
              item.restaurantName ||
              (item as unknown as { restaurant_name?: string }).restaurant_name ||
              item.restaurant?.name ||
              "식당";
            const category =
              item.category ||
              item.restaurant?.category ||
              "기타";
            const time = formatTime(item.eatenAt);
            return (
              <li key={item.id} className="bg-white rounded-2xl p-3 shadow-sm flex gap-3 items-center">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <SafeImage
                    src={item.photoUrl ?? null}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">{name}</p>
                  <p className="text-sm text-[#FF6B35] mt-0.5">이거 먹었어요! 🍽️</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {category}{time ? ` · ${time}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 이전 식사 기록 */}
      <div className="px-4 mt-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-900 mb-2">이전 식사 기록</p>
          {latestMeal === null ? (
            <p className="text-sm text-gray-400">기록이 없어요</p>
          ) : editingId === latestMeal.id ? (
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#FF6B35]"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEditSave()}
                autoFocus
              />
              <button
                onClick={handleEditSave}
                className="text-sm text-white bg-[#FF6B35] px-3 py-2 rounded-lg font-medium"
              >
                저장
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-sm text-gray-500 px-2 py-2"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-700">
                이전에{" "}
                <span className="font-semibold text-gray-900">{latestMealName}</span>{" "}
                먹었어요
              </p>
              <button
                onClick={() => {
                  setEditingId(latestMeal.id);
                  setEditName(latestMealName);
                }}
                className="text-lg text-gray-400 hover:text-gray-600 flex-shrink-0"
                aria-label="수정"
              >
                ✏️
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 이번 달 카테고리 통계 */}
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

      <BottomNav />

      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
