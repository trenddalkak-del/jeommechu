"use client";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { Settings } from "lucide-react";

interface ProfileHeaderProps {
  onSettingsOpen: () => void;
}

export default function ProfileHeader({ onSettingsOpen }: ProfileHeaderProps) {
  const { data: session, status } = useSession();
  const name = session?.user?.name ?? null;
  const image = session?.user?.image ?? null;
  const isLoggedIn = status === "authenticated" && !!name;

  return (
    <div className="flex items-center justify-between px-5 pt-12 pb-4">
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {image ? (
                <Image
                  src={image}
                  alt={name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{name}님의</p>
              <p className="text-sm text-gray-400">식사기록</p>
            </div>
          </>
        ) : status === "loading" ? (
          <>
            <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="space-y-1">
              <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 text-xl">?</span>
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">로그인해주세요</p>
              <button
                onClick={() => signIn("kakao")}
                className="mt-1 text-xs text-white bg-[#FEE500] text-[#191919] font-semibold px-3 py-1 rounded-full"
              >
                카카오 로그인
              </button>
            </div>
          </>
        )}
      </div>
      <button
        onClick={onSettingsOpen}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        aria-label="설정"
      >
        <Settings className="w-5 h-5 text-gray-500" />
      </button>
    </div>
  );
}
