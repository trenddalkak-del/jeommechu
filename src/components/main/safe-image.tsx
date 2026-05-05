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
}

/**
 * Image component with skeleton loading and multi-URL fallback.
 * - Tries each URL in srcs (or src) in order.
 * - Renders nothing when ALL URLs fail or none are provided.
 */
export default function SafeImage({
  src,
  srcs,
  alt,
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
      {imageStatus === "loading" && (
        <div className={`${className} bg-gray-200 animate-pulse`} />
      )}
      <img
        key={currentUrl}
        src={currentUrl}
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
