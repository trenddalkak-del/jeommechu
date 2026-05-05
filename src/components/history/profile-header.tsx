"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import { Settings } from "lucide-react";

interface ProfileHeaderProps {
  onSettingsOpen: () => void;
}

export default function ProfileHeader({ onSettingsOpen }: ProfileHeaderProps) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "사용자";
  const image = session?.user?.image ?? null;

  return (
    <div className="flex items-center justify-between px-5 pt-12 pb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {image ? (
            <Image
              src={image}
              alt={name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
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
