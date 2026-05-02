"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const FOOD_TAGS = [
  "우유/유제품", "계란", "땅콩", "갑각류", "생선", "밀가루/글루텐",
  "대두", "견과류", "매운 음식", "돼지고기", "소고기", "회/생선회",
];

const DISTANCE_OPTIONS = [
  { label: "5분", value: 5 },
  { label: "10분", value: 10 },
  { label: "15분", value: 15 },
  { label: "20분", value: 20 },
];

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? 300 : -300, opacity: 0 }),
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [distanceMin, setDistanceMin] = useState(10);

  const goTo = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleLocationRequest = () => {
    setLocationError(null);
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationLoading(false);
        goTo(1);
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("위치 권한이 거부되었어요. 설정에서 허용해 주세요.");
        } else {
          setLocationError("위치를 가져오지 못했어요. 다시 시도해 주세요.");
        }
      },
      { timeout: 10000 }
    );
  };

  const toggleAllergy = (tag: string) => {
    setAllergies((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleComplete = () => {
    localStorage.setItem("onboarding", JSON.stringify({ lat, lng, allergies, distanceMin }));
    router.push("/main");
  };

  const handleKakaoLogin = async () => {
    localStorage.setItem("onboarding", JSON.stringify({ lat, lng, allergies, distanceMin }));
    await signIn("kakao", { callbackUrl: "/main" });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 bg-white">
      <div className="flex gap-2 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              backgroundColor: i === step ? "#FF6B35" : "#E5E5E5",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md mx-auto px-6 overflow-hidden relative" style={{ minHeight: 420 }}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === 0 && (
            <motion.div key="step0" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center text-center">
              <div className="mb-8">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="40" fill="#FF6B35" fillOpacity="0.1" />
                  <path d="M40 18C31.163 18 24 25.163 24 34C24 45.5 40 62 40 62C40 62 56 45.5 56 34C56 25.163 48.837 18 40 18ZM40 40C36.686 40 34 37.314 34 34C34 30.686 36.686 28 40 28C43.314 28 46 30.686 46 34C46 37.314 43.314 40 40 40Z" fill="#FF6B35" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">내 위치를 알려주세요</h1>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">주변 맛집을 찾기 위해<br />위치 정보가 필요해요</p>
              {locationError && (
                <p className="text-red-500 text-sm mb-4 bg-red-50 rounded-xl px-4 py-3 w-full text-left">{locationError}</p>
              )}
              <button onClick={handleLocationRequest} disabled={locationLoading} className="w-full h-12 rounded-xl text-base font-semibold text-white transition-colors bg-[#FF6B35] hover:bg-[#e55e2e] disabled:bg-[#FFB494]">
                {locationLoading ? "위치 가져오는 중..." : "위치 허용하기"}
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">안 먹는 음식이 있나요?</h1>
              <p className="text-gray-500 text-sm mb-6 text-center">해당하는 항목을 선택하세요 (선택사항)</p>
              <div className="flex flex-wrap gap-2 justify-center mb-8">
                {FOOD_TAGS.map((tag) => {
                  const selected = allergies.includes(tag);
                  return (
                    <button key={tag} onClick={() => toggleAllergy(tag)} className="rounded-full px-4 py-2 text-sm font-medium transition-colors border" style={{ backgroundColor: selected ? "#FF6B35" : "#fff", borderColor: selected ? "#FF6B35" : "#E5E5E5", color: selected ? "#fff" : "#374151" }}>
                      {tag}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => goTo(2)} className="w-full h-12 rounded-xl text-base font-semibold text-white mb-3 bg-[#FF6B35] hover:bg-[#e55e2e] transition-colors">다음</button>
              <button onClick={() => goTo(2)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">건너뛰기</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">얼마나 멀리 갈 수 있어요?</h1>
              <p className="text-gray-500 text-sm mb-8 text-center">도보 기준 거리를 선택하세요</p>
              <div className="grid grid-cols-4 gap-3 w-full mb-8">
                {DISTANCE_OPTIONS.map((opt) => {
                  const selected = distanceMin === opt.value;
                  return (
                    <button key={opt.value} onClick={() => setDistanceMin(opt.value)} className="rounded-xl p-4 text-center transition-colors border" style={{ backgroundColor: selected ? "#FFF7F3" : "#fff", borderColor: selected ? "#FF6B35" : "#E5E5E5", color: selected ? "#FF6B35" : "#374151" }}>
                      <span className="text-base font-semibold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={() => goTo(3)} className="w-full h-12 rounded-xl text-base font-semibold text-white mb-3 bg-[#FF6B35] hover:bg-[#e55e2e] transition-colors">다음</button>
              <button onClick={handleComplete} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">건너뛰기</button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" custom={direction} variants={variants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="flex flex-col items-center text-center">
              <div className="mb-8">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="40" fill="#FEE500" fillOpacity="0.3" />
                  <text x="40" y="52" textAnchor="middle" fontSize="32">💬</text>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">카카오로 저장하기</h1>
              <p className="text-gray-500 text-sm mb-2 leading-relaxed">카카오 계정으로 로그인하면<br />기기가 바뀌어도 기록이 유지돼요</p>
              <p className="text-xs text-gray-400 mb-8">(선택사항 · 나중에 연결할 수 있어요)</p>
              <button
                onClick={handleKakaoLogin}
                className="w-full h-12 rounded-xl text-base font-semibold text-[#3C1E1E] mb-3 flex items-center justify-center gap-2 transition-colors"
                style={{ backgroundColor: "#FEE500" }}
              >
                <span>카카오로 계속하기</span>
              </button>
              <button onClick={handleComplete} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors text-center">
                기기 ID로 계속하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
