"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { setSessionUserId, clearSessionUserId } from "@/lib/user";

export default function SessionSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.kakaoId) {
      // 서버에 유저 동기화 후 localStorage에 DB userId 저장
      fetch("/api/auth/callback/kakao-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kakaoId: session.user.kakaoId,
          name: session.user.name,
          image: session.user.image,
          email: session.user.email,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.userId) {
            setSessionUserId(data.userId);
          }
        })
        .catch(() => {});
    } else if (status === "unauthenticated") {
      clearSessionUserId();
    }
  }, [session, status]);

  return null;
}
