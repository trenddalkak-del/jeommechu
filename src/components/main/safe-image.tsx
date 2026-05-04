"use client";

import { useMemo, useState } from "react";
import { getCategoryImage } from "@/lib/category-images";

interface SafeImageProps {
  /** Legacy single URL. Ignored when srcs is provided and non-empty. */
  src?: string | null | undefined;
  /** Multiple candidate URLs to try in order (landscape-first). */
  srcs?: string[];
  alt: string;
  category?: string;
  className?: string;
  loading?: "eager" | "lazy";
}

/**
 * Image component with skeleton loading and multi-URL fallback.
 * - Tries each URL in srcs (or src) in order.
 * - Falls back to category image only when ALL URLs fail or none are provided.
 */
export default function SafeImage({
  src,
  srcs,
  alt,
  category,
  className = "",
  loading = "lazy",
}: SafeImageProps) {
  // Resolve the list of URLs to try
  const urls = useMemo<string[]>(() => {
    if (srcs && srcs.length > 0) return srcs;
    if (src) return [src];
    return [];
  }, [srcs, src]);

  const [urlIndex, setUrlIndex] = useState(0);
  const [imageStatus, setImageStatus] = useState<"loading" | "loaded" | "error">(
    urls.length > 0 ? "loading" : "error"
  );

  const fallbackSrc = getCategoryImage(category || "");

  // No URLs at all → show category fallback immediately (no skeleton)
  if (urls.length === 0) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading={loading}
      />
    );
  }

  const handleError = () => {
    if (urlIndex < urls.length - 1) {
      // Try next URL
      setUrlIndex((prev) => prev + 1);
      setImageStatus("loading");
    } else {
      // All URLs failed → show category fallback
      setImageStatus("error");
    }
  };

  const currentUrl = urls[urlIndex];
  const displaySrc = imageStatus === "error" ? fallbackSrc : currentUrl;

  return (
    <>
      {imageStatus === "loading" && (
        <div className={`${className} bg-gray-200 animate-pulse`} />
      )}
      <img
        key={currentUrl}
        src={displaySrc}
        alt={alt}
        className={`${className} ${imageStatus === "loading" ? "opacity-0" : "opacity-100"}`}
        style={imageStatus === "loading" ? { position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 } : {}}
        loading={loading}
        onLoad={() => setImageStatus("loaded")}
        onError={handleError}
      />
    </>
  );
}
