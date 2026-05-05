"use client";

import { useMemo, useState } from "react";

interface SafeImageProps {
  /** Legacy single URL. Ignored when srcs is provided and non-empty. */
  src?: string | null | undefined;
  /** Multiple candidate URLs to try in order (landscape-first). */
  srcs?: string[];
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  /** Background color shown while the image loads. Defaults to #E5E7EB (gray). */
  placeholderColor?: string;
}

/**
 * Image component with color placeholder loading and multi-URL fallback.
 * - Tries each URL in srcs (or src) in order.
 * - Shows a category-colored placeholder while loading (fades out on load).
 * - Renders nothing when ALL URLs fail or none are provided.
 */
export default function SafeImage({
  src,
  srcs,
  alt,
  className = "",
  loading = "lazy",
  placeholderColor = "#E5E7EB",
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

  // No URLs at all → render nothing
  if (urls.length === 0) {
    return null;
  }

  const handleError = () => {
    if (urlIndex < urls.length - 1) {
      // Try next URL
      setUrlIndex((prev) => prev + 1);
      setImageStatus("loading");
    } else {
      // All URLs failed → render nothing
      setImageStatus("error");
    }
  };

  const currentUrl = urls[urlIndex];

  if (imageStatus === "error") {
    return null;
  }

  return (
    <>
      {/* Category-colored placeholder — fades out after image loads */}
      <div
        className={`${className} transition-opacity duration-500 ${
          imageStatus === "loaded" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{ backgroundColor: placeholderColor }}
      />
      {/* Image — invisible until loaded, then fades in */}
      <img
        key={currentUrl}
        src={currentUrl}
        alt={alt}
        className={`${className} transition-opacity duration-500 ${
          imageStatus === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        loading={loading}
        onLoad={() => setImageStatus("loaded")}
        onError={handleError}
      />
    </>
  );
}
