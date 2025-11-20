"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      {/* 动态背景层 */}
      <div className="absolute inset-0 z-0">
        {/* 渐变光晕 1 */}
        <motion.div
          className="absolute -left-[10%] -top-[10%] h-[50vw] w-[50vw] rounded-full bg-primary/20 blur-[100px]"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* 渐变光晕 2 */}
        <motion.div
          className="absolute -bottom-[10%] -right-[10%] h-[50vw] w-[50vw] rounded-full bg-accent/20 blur-[100px]"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* 内容层 */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
