"use client";

import useLocalStorage from "@/hooks/use-local-storage";
import { APP_THEME_COLORS } from "@/lib/theme-config"; // Import shared config
import { toastUnavailable } from "@/lib/utils";
import Cookies from "js-cookie";
import { ChevronRight, Moon, X } from "lucide-react";
import { useTheme } from "next-themes"; // Import useTheme
import { useState } from "react";

// Define props type
interface SettingsDialogContentProps {
  onClose: () => void;
}

export function SettingsDialogContent({ onClose }: SettingsDialogContentProps) {
  // Settings state
  const { setTheme } = useTheme(); // Get setTheme function
  const [fontSizeScale, setFontSizeScale] = useLocalStorage<number>("novel__font-size-scale", 1);
  const [selectedBg, setSelectedBg] = useLocalStorage<string>("novel__background-color", "white");
  const [aiHighlightEnabled, setAiHighlightEnabled] = useLocalStorage<boolean>("novel__ai-highlight-enabled", true);
  const [customTitleStyle, setCustomTitleStyle] = useState(true);
  const [screenAlwaysOn, setScreenAlwaysOn] = useState(false);
  return (
    <>
      {/* Overlay for the dialog */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Close settings"
      />
      {/* Main dialog content */}
      <div
        className={`fixed bottom-0 left-0 right-0 w-full flex flex-col p-5 rounded-t-2xl shadow-2xl z-50 app-dialog-theme ${APP_THEME_COLORS.find((tc) => tc.value === selectedBg)?.applyClass || "bg-white"} text-[color:var(--app-text-color)]`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex justify-center items-center mb-5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors hover:bg-[color:var(--app-hover-bg)]"
            aria-label="Close"
          >
            <X className="h-[22px] w-[22px] text-[color:var(--app-icon-color)]" />
          </button>
          <h2 className="text-lg font-medium text-[color:var(--app-title-color)]">设置</h2>
        </div>

        {/* Body */}
        <div className="space-y-3.5">
          {/* Combined Card for Font Size and Background Color */}
          <div className={`rounded-lg bg-[color:var(--app-card-bg)] ${selectedBg !== "dark" ? "shadow-sm" : ""}`}>
            {/* Font Size Section */}
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium w-[15%] flex-shrink-0 text-[color:var(--app-section-title-color)]">
                字号
              </span>
              <div className="flex items-center gap-x-3 flex-grow">
                <span className="text-xs text-[color:var(--app-icon-color)]">A</span>
                <input
                  type="range"
                  min="0.8"
                  max="1.5"
                  step="0.05"
                  value={fontSizeScale}
                  onChange={(e) => setFontSizeScale(Number.parseFloat(e.target.value))}
                  className="custom-slider-thumb flex-1 h-5 rounded-full appearance-none cursor-pointer bg-[color:var(--app-slider-bg)]"
                  id="font-size-slider"
                />
                <span className="text-lg text-[color:var(--app-icon-color)]">A</span>
              </div>
            </div>

            {/* Divider */}
            <hr className="mx-4 border-[color:var(--app-divider-border)]" />

            {/* Background Color Section */}
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm font-medium w-[15%] flex-shrink-0 text-[color:var(--app-section-title-color)]">
                背景
              </span>
              <div className="flex items-center flex-grow overflow-x-auto flex-nowrap gap-x-5 justify-start py-1 px-1">
                {APP_THEME_COLORS.map((themeColor) => (
                  <button
                    type="button"
                    key={themeColor.value}
                    onClick={() => {
                      setSelectedBg(themeColor.value);
                      setTheme(themeColor.value === "dark" ? "dark" : "light");

                      // 同时设置cookie，确保服务端可以读取
                      // 设置为30天过期，使用安全配置确保浏览器兼容性
                      try {
                        Cookies.set("novel__background-color", themeColor.value, {
                          expires: 30,
                          path: "/",
                          sameSite: "strict",
                          secure: window.location.protocol === "https:",
                        });
                      } catch (e) {
                        console.error("Error updating cookie while setting background:", e);
                      }
                    }}
                    className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 flex-shrink-0
                      ${selectedBg === themeColor.value ? "border-[color:var(--app-option-selected-border)]" : themeColor.value === "white" && selectedBg !== "dark" ? "border-[color:var(--app-option-white-border-light)]" : themeColor.value === "white" && selectedBg === "dark" ? "border-[color:var(--app-option-white-border-dark)]" : "border-transparent"}
                      ${themeColor.previewStyle}
                      ${selectedBg === "dark" && themeColor.value !== "dark" && themeColor.previewStyle === "bg-white border" ? "!border-[color:var(--app-option-white-border-dark-override)]" : ""}
                    `}
                    aria-label={`Set background to ${themeColor.name || themeColor.value}`}
                  >
                    {themeColor.value === "dark" && (
                      <Moon className="h-[18px] w-[18px] text-[color:var(--app-moon-icon-color)]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* History Card */}
          <button
            type="button"
            onClick={toastUnavailable}
            className={`flex w-full items-center justify-between p-4 rounded-lg transition-colors bg-[color:var(--app-card-bg)] ${selectedBg !== "dark" ? "shadow-sm" : ""} hover:bg-[color:var(--app-hover-bg)]`}
          >
            <span className="text-sm font-medium text-[color:var(--app-section-title-color)]">历史记录</span>
            <ChevronRight className="h-5 w-5 text-[color:var(--app-history-icon-color)]" />
          </button>

          {/* Toggle Items Container */}
          <div
            className={`p-4 rounded-lg space-y-4 bg-[color:var(--app-card-bg)] ${selectedBg !== "dark" ? "shadow-sm" : ""}`}
          >
            {/* Custom Title Style */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[color:var(--app-section-title-color)]">自定义标题样式</span>
              <div
                onClick={toastUnavailable}
                onKeyUp={(e) => {
                  if (e.key === "Enter" || e.key === " ") toastUnavailable();
                }}
                role="switch"
                aria-checked={customTitleStyle}
                tabIndex={0}
                className={`relative inline-flex items-center h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-toggle-focus-ring)] focus-visible:ring-opacity-75
                  ${customTitleStyle ? "bg-[color:var(--app-toggle-on-bg)]" : "bg-[color:var(--app-toggle-off-bg)]"}
                `}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-[color:var(--app-toggle-thumb-bg)] shadow-lg ring-0 transition duration-200 ease-in-out
                    ${customTitleStyle ? "translate-x-[20px]" : "translate-x-0"}`}
                />
              </div>
            </div>

            {/* Screen Always On */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[color:var(--app-section-title-color)]">屏幕常亮</span>
              <div
                onClick={toastUnavailable}
                onKeyUp={(e) => {
                  if (e.key === "Enter" || e.key === " ") toastUnavailable();
                }}
                role="switch"
                aria-checked={screenAlwaysOn}
                tabIndex={0}
                className={`relative inline-flex items-center h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-toggle-focus-ring)] focus-visible:ring-opacity-75
                  ${screenAlwaysOn ? "bg-[color:var(--app-toggle-on-bg)]" : "bg-[color:var(--app-toggle-off-bg)]"}
                `}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-[color:var(--app-toggle-thumb-bg)] shadow-lg ring-0 transition duration-200 ease-in-out
                    ${screenAlwaysOn ? "translate-x-[20px]" : "translate-x-0"}`}
                />
              </div>
            </div>

            {/* AI Highlight */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[color:var(--app-section-title-color)]">AI操作内容高亮</span>
              <div
                onClick={() => setAiHighlightEnabled(!aiHighlightEnabled)}
                onKeyUp={(e) => {
                  if (e.key === "Enter" || e.key === " ") setAiHighlightEnabled(!aiHighlightEnabled);
                }}
                role="switch"
                aria-checked={aiHighlightEnabled}
                tabIndex={0}
                className={`relative inline-flex items-center h-[22px] w-[42px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-toggle-focus-ring)] focus-visible:ring-opacity-75
                  ${aiHighlightEnabled ? "bg-[color:var(--app-toggle-on-bg)]" : "bg-[color:var(--app-toggle-off-bg)]"}
                `}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-[color:var(--app-toggle-thumb-bg)] shadow-lg ring-0 transition duration-200 ease-in-out
                    ${aiHighlightEnabled ? "translate-x-[20px]" : "translate-x-0"}`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
