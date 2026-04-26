"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/main",
    label: "홈",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "#FF6B35" : "none"}
        stroke={active ? "#FF6B35" : "#9CA3AF"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: "/favorites",
    label: "즐겨찾기",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? "#FF6B35" : "none"}
        stroke={active ? "#FF6B35" : "#9CA3AF"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "기록",
    icon: (active: boolean) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={active ? "#FF6B35" : "#9CA3AF"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex safe-area-inset-bottom">
      {tabs.map((tab) => {
        const active = pathname === tab.href || (tab.href === "/main" && pathname.startsWith("/main"));
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${
              active ? "text-[#FF6B35]" : "text-gray-400"
            }`}
          >
            {tab.icon(active)}
            <span className={`text-[10px] font-medium ${active ? "text-[#FF6B35]" : "text-gray-400"}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
