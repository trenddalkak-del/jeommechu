"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/user";
import BottomNav from "@/components/BottomNav";

interface MealRecord {
  id: string;
  category: string;
  eatenAt: string;
  restaurant: {
    name: string;
    category: string;
  } | null;
}

function groupByDate(records: MealRecord[]): [string, MealRecord[]][] {
  const map = new Map<string, MealRecord[]>();
  for (const record of records) {
    const date = new Date(record.eatenAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    const existing = map.get(date) ?? [];
    existing.push(record);
    map.set(date, existing);
  }
  return Array.from(map.entries());
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const CATEGORY_EMOJIS: Record<string, string> = {
  한식: "🍚",
  중식: "🥡",
  일식: "🍣",
  양식: "🍝",
  분식: "🥚",
  아시안: "🍜",
  샐러드: "🥗",
  패스트푸드: "🍔",
  피자: "🍕",
  치킨: "🍗",
};

function getCategoryEmoji(category: string) {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJIS)) {
    if (category.includes(key)) return emoji;
  }
  return "🍽️";
}

export default function HistoryPage() {
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/meals?userId=${getUserId()}&days=30`)
      .then((r) => r.json())
      .then((data) => {
        setRecords(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grouped = groupByDate(records);

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">식사 기록</h1>
        <p className="text-sm text-gray-400 mt-1">최근 30일 점심 기록</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          불러오는 중...
        </div>
      ) : records.length === 0 ? (
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
            <circle cx="12" cy="12" r="9" />
            <polyline points="12 7 12 12 15 15" />
          </svg>
          <p className="text-gray-400 text-sm">아직 식사 기록이 없어요</p>
          <p className="text-gray-300 text-xs">점심을 추천받고 기록을 쌓아보세요</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-5">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {date}
              </p>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 text-xl">
                      {getCategoryEmoji(item.restaurant?.category ?? item.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {item.restaurant?.name ?? "식당"}
                      </p>
                      <p className="text-sm text-[#FF6B35] font-medium">{item.category}</p>
                    </div>
                    <span className="text-xs text-gray-300 flex-shrink-0">
                      {formatTime(item.eatenAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </main>
  );
}
