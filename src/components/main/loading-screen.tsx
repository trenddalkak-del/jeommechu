"use client";

import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-white"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-6xl mb-8"
      >
        🍽️
      </motion.div>

      <h2 className="text-xl font-bold text-gray-900 mb-2">맛집 찾는 중...</h2>
      <p className="text-gray-500 text-sm">주변 맛집을 검색하고 있어요</p>

      <div className="flex gap-2 mt-8">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-[#FF6B35]"
          />
        ))}
      </div>
    </motion.div>
  );
}
