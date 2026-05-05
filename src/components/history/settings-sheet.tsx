"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { X } from "lucide-react";

const RADIUS_OPTIONS = [
  { label: "800m", value: 800 },
  { label: "1km", value: 1000 },
  { label: "1.5km", value: 1500 },
];

const APP_VERSION = "v0.1.0";

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsSheet({ open, onClose }: SettingsSheetProps) {
  const [radius, setRadius] = useState<number>(800);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Load saved radius on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("searchRadius");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (RADIUS_OPTIONS.some((o) => o.value === parsed)) {
          setRadius(parsed);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Save radius on change
  const handleRadiusChange = (value: number) => {
    setRadius(value);
    try {
      localStorage.setItem("searchRadius", String(value));
    } catch { /* ignore */ }
  };

  const handleLogout = async () => {
    onClose();
    await signOut({ callbackUrl: "/" });
  };

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={handleOverlayClick}
    >
      <div className="w-full max-w-lg bg-white rounded-t-3xl pb-8 pt-5 px-5 shadow-2xl animate-slide-up">
        {/* Handle bar */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">설정</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="닫기"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Search Radius */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">검색 반경</p>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleRadiusChange(option.value)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  radius === option.value
                    ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mb-6" />

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 text-sm font-medium text-red-500 hover:text-red-600 text-left"
        >
          로그아웃
        </button>

        {/* Version */}
        <p className="text-xs text-gray-400 mt-4 text-center">{APP_VERSION}</p>
      </div>
    </div>
  );
}
