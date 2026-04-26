import { NextResponse } from "next/server";
// import { prisma } from "@/lib/prisma";

/**
 * [Phase 2 준비] 카카오 OAuth 로그인 엔드포인트
 *
 * 실제 구현 시 흐름:
 * 1. 카카오 OAuth 코드 → 액세스 토큰 교환
 * 2. 액세스 토큰으로 카카오 사용자 정보 조회 (kakaoId 획득)
 * 3. DB에서 kakaoId로 기존 유저 조회
 *    - 있음: 로그인 처리 후 세션 발급
 *    - 없음: 기존 deviceId 유저에 kakaoId 연결 (데이터 마이그레이션 없이 계정 통합)
 *      → prisma.user.update({ where: { id: deviceUserId }, data: { kakaoId } })
 * 4. JWT 세션 토큰 발급
 */
export async function POST() {
  return NextResponse.json(
    { message: "카카오 로그인은 아직 준비 중입니다." },
    { status: 501 }
  );
}
