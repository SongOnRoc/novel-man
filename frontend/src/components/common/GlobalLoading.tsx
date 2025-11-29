"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

export type LoadingTip = {
  type: "text" | "image" | "video";
  content: string;
  author?: string; // For quotes
};

const DEFAULT_TIPS: LoadingTip[] = [
  { type: "text", content: "好的故事需要时间打磨..." },
  { type: "text", content: "正在构建您的创作世界..." },
  { type: "text", content: "灵感正在加载中..." },
  { type: "text", content: "每一个字符都充满力量。" },
];

interface GlobalLoadingProps {
  tips?: LoadingTip[];
  fullScreen?: boolean;
}

export function GlobalLoading({ tips = DEFAULT_TIPS, fullScreen = true }: GlobalLoadingProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const currentTip = tips[currentTipIndex];

  return (
    <div
      className={`flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-500 ${
        fullScreen ? "fixed inset-0 z-50" : "h-full w-full min-h-[400px]"
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Logo/Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-xl" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative z-10 rounded-full bg-background p-4 shadow-lg ring-1 ring-border"
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            className="absolute -right-2 -top-2"
          >
            <Sparkles className="h-5 w-5 text-amber-400" />
          </motion.div>
        </div>

        {/* Dynamic Tips */}
        <div className="h-24 max-w-md px-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-2"
            >
              {currentTip.type === "text" && (
                <p className="text-lg font-medium text-foreground/80">
                  {currentTip.content}
                </p>
              )}
              {currentTip.type === "image" && (
                <div className="overflow-hidden rounded-lg shadow-sm">
                  <img
                    src={currentTip.content}
                    alt="Loading Tip"
                    className="h-32 w-auto object-cover"
                  />
                </div>
              )}
              {currentTip.author && (
                <span className="text-sm text-muted-foreground">
                  — {currentTip.author}
                </span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
