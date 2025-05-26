"use client";

import useLocalStorage from "@/hooks/use-local-storage";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { BounceAnimation, PulseAnimation, WaveAnimation } from "./loading-animations";

export default function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(true);
  const [animationType, _setAnimationType] = useState<"pulse" | "bounce" | "wave">("bounce");
  const [selectedBg] = useLocalStorage<string>("novel__background-color", "white");

  useEffect(() => {
    const updateCookie = () => {
      try {
        Cookies.set("novel__background-color", selectedBg, {
          expires: 30,
          path: "/",
          sameSite: "strict",
          secure: window.location.protocol === "https:",
        });
      } catch (e) {
        console.error("Error updating cookie while complete loading:", e);
      }
    };

    const handleLoad = () => setIsLoading(false);

    if (document.readyState === "complete") {
      updateCookie();
      setIsLoading(false);
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm"
      style={{ backgroundColor: "var(--novel-bg-color, white)" }}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* 主加载内容 */}
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="relative">
            {animationType === "wave" && (
              <div className="h-24 flex items-center justify-center">
                <WaveAnimation className="scale-150" />
              </div>
            )}
            {animationType === "pulse" && (
              <div className="h-24 flex items-center justify-center">
                <PulseAnimation className="scale-150" />
              </div>
            )}
            {animationType === "bounce" && (
              <div className="h-24 flex items-center justify-center">
                <BounceAnimation className="scale-150" />
              </div>
            )}
          </div>

          <p className="text-xl font-medium text-blue-600 animate-pulse">加载中...</p>

          <div className="w-72 h-2 bg-blue-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-progress"
              style={{ animationDuration: "1.8s" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
