"use client";

import React, { useState } from "react";
import NextImage, { ImageProps as NextImageProps } from "next/image";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

export interface ImageProps extends Omit<NextImageProps, "onError"> {
  fallbackText?: string;
  fallbackSrc?: string;
  fallbackColor?: string;
}

export function Image({
  src,
  alt,
  className,
  fallbackText,
  fallbackSrc,
  fallbackColor,
  fill = true, // Default to fill as we usually wrap it in a sized container
  ...props
}: ImageProps & { fill?: boolean }) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Helper to check if src is a valid URL or relative path
  const isValidUrl = (url: string | undefined | null): boolean => {
    if (!url) return false;
    if (url.startsWith("/")) return true; // Relative path
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isStaticImport = (src: any): boolean => {
    return typeof src === "object" && src !== null;
  };

  const validSrc = (isStaticImport(src) || (typeof src === "string" && isValidUrl(src))) ? src : null;
  const showFallback = error || !validSrc;

  // Generate a consistent gradient based on fallbackText
  const getGradient = (text: string) => {
    const colors = [
      "from-emerald-500/20 to-teal-500/20",
      "from-blue-500/20 to-indigo-500/20",
      "from-amber-500/20 to-orange-500/20",
      "from-rose-500/20 to-pink-500/20",
      "from-violet-500/20 to-purple-500/20",
    ];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const gradientClass = fallbackText ? getGradient(fallbackText) : "from-muted to-muted/50";

  if (showFallback) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br",
          fallbackColor || gradientClass,
          className
        )}
        role="img"
        aria-label={alt}
      >
        {fallbackSrc ? (
          <img
            src={fallbackSrc}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : fallbackText ? (
          <div className="flex flex-col items-center justify-center text-center p-2 select-none">
            <span className="text-3xl font-black uppercase tracking-tighter opacity-40 font-serif">
              {fallbackText.slice(0, 1)}
            </span>
          </div>
        ) : (
          <div className="h-full w-full bg-muted/50" />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <NextImage
        src={validSrc!}
        alt={alt}
        fill={fill}
        className={cn(
          "object-cover transition-all duration-500",
          loading ? "scale-105 blur-sm" : "scale-100 blur-0"
        )}
        onLoad={() => setLoading(false)}
        onError={() => setError(true)}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        {...props}
      />
      {loading && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
    </div>
  );
}
