const DEVICE_ID_KEY = "device_id";

/**
 * 디바이스 고유 ID를 반환합니다.
 * 최초 접속 시 UUID v4를 생성해 localStorage에 저장하고, 이후 재사용합니다.
 */
export function getUserId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
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
