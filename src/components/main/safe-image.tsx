"use client";

import { useState } from "react";
import { getCategoryImage } from "@/lib/category-images";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  category?: string;
  className?: string;
  loading?: "eager" | "lazy";
}

/**
 * Image component with skeleton loading and onError fallback.
 * If the Google photo fails to load, falls back to a category image.
 * If no photo_url is provided at all, shows the category image immediately.
 */
export default function SafeImage({
  src,
  alt,
  category,
  className = "",
  loading = "lazy",
}: SafeImageProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );

  const fallbackSrc = getCategoryImage(category || "");

  // If no src provided, show fallback immediately (no skeleton)
  if (!src) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={loading}
      />
    );
  }

  const displaySrc = status === "error" ? fallbackSrc : src;

  return (
    <>
      {status === "loading" && (
        <div className={`${className} bg-gray-200 animate-pulse`} />
      )}
      <img
        src={displaySrc}
        alt={alt}
        className={`${className} ${status === "loading" ? "hidden" : "block"}`}
        loading={loading}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
    </>
  );
}
