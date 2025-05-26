"use client";
import LoadingOverlay from "@/components/ui/loading-overlay";
import useLocalStorage from "@/hooks/use-local-storage";
import { APP_THEME_COLORS } from "@/lib/theme-config"; // Import the shared config
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider, useTheme } from "next-themes";
import { type Dispatch, type ReactNode, type SetStateAction, createContext, useEffect, useLayoutEffect } from "react";
import { Toaster } from "sonner";

export const AppContext = createContext<{
  font: string;
  setFont: Dispatch<SetStateAction<string>>;
}>({
  font: "Default",
  setFont: () => {},
});

const ToasterProvider = () => {
  const { theme } = useTheme() as {
    theme: "light" | "dark" | "system";
  };
  return (
    <Toaster
      theme={theme}
      toastOptions={{
        className:
          "text-center justify-center rounded-lg bg-black/80 text-white dark:bg-white/90 dark:text-black w-auto py-2",
        descriptionClassName: "text-center",
        unstyled: false,
        duration: 1500, // Default toast duration: 3000ms (3 seconds)
      }}
    />
  );
};

function ThemeWrapper({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [selectedBg] = useLocalStorage<string>("novel__background-color", "white");

  useEffect(() => {
    if (typeof window !== "undefined" && theme) {
      const pageElement = document.querySelector(".flex.h-screen.flex-col");

      if (pageElement) {
        // 1. Clear previous custom background classes and dark text color
        APP_THEME_COLORS.forEach((themeColor) => {
          if (themeColor.applyClass) {
            pageElement.classList.remove(themeColor.applyClass);
          }
        });
        pageElement.classList.remove("text-gray-100");

        // 2. Apply styles based on the current theme
        if (theme === "dark") {
          pageElement.classList.add("text-gray-100");
        } else {
          const customBgTheme =
            APP_THEME_COLORS.find((t) => t.value === selectedBg) || APP_THEME_COLORS.find((t) => t.value === "white");

          if (customBgTheme?.applyClass) {
            pageElement.classList.add(customBgTheme.applyClass);
          }
        }
      }
    }
  }, [theme, selectedBg]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: ReactNode }) {
  const [font, setFont] = useLocalStorage<string>("novel__font", "Default");
  const [fontSizeScale] = useLocalStorage<number>("novel__font-size-scale", 1);
  const { setTheme } = useTheme();

  useLayoutEffect(() => {
    // 同步主题和字体设置
    const savedTheme = localStorage.getItem("novel-theme") || "system";
    setTheme(savedTheme);
    document.documentElement.style.setProperty("--font-size-scale-factor", fontSizeScale.toString());
  }, [fontSizeScale, setTheme]);

  return (
    <ThemeProvider
      attribute="class"
      storageKey="novel-theme"
      enableSystem={false}
      disableTransitionOnChange
      defaultTheme="system"
    >
      <LoadingOverlay />
      <AppContext.Provider value={{ font, setFont }}>
        <ThemeWrapper>
          <ToasterProvider />
          {children}
          <Analytics />
        </ThemeWrapper>
      </AppContext.Provider>
    </ThemeProvider>
  );
}
