const DEVICE_ID_KEY = "device_id";
const SESSION_USER_ID_KEY = "session_user_id";

/**
 * 현재 사용자 ID를 반환합니다.
 * 로그인된 경우 세션에서 가져온 DB 유저 ID를, 아닌 경우 디바이스 ID를 사용합니다.
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  // 로그인된 세션 유저 ID가 있으면 우선 사용
  const sessionUserId = localStorage.getItem(SESSION_USER_ID_KEY);
  if (sessionUserId) {
    return sessionUserId;
  }

  // 미로그인 시 디바이스 ID fallback
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * 로그인 성공 후 세션 유저 ID를 저장합니다.
 */
export function setSessionUserId(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_USER_ID_KEY, userId);
}

/**
 * 로그아웃 시 세션 유저 ID를 제거합니다.
 */
export function clearSessionUserId(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_USER_ID_KEY);
}

/**
 * 서버에 유저 레코드가 없으면 생성합니다 (idempotent).
 * 앱 최초 로드 시 1회 호출하세요.
 */
export async function ensureUser(userId: string): Promise<void> {
  if (!userId) return;
  await fetch("/api/users/ensure", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
}
