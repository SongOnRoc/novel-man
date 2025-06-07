"use client"; // 标记为客户端组件，因为需要访问浏览器API

import * as React from "react";
import { useTheme } from "next-themes"; // 导入主题钩子
import { Button } from "@/components/ui/button"; // 导入按钮组件
import { Moon, Sun } from "lucide-react"; // 导入图标

// 主题切换按钮组件
export function ThemeSwitcher() {
  // 使用next-themes提供的钩子获取当前主题和设置主题的函数
  const { theme, setTheme } = useTheme();

  // 切换主题的处理函数
  const toggleTheme = () => {
    // 如果当前是深色模式，切换到浅色模式；否则切换到深色模式
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <Button
      variant="outline" // 使用轮廓按钮样式
      size="icon" // 图标按钮大小
      onClick={toggleTheme} // 点击时切换主题
      className="rounded-full" // 圆形按钮
    >
      {/* 根据当前主题显示不同的图标 */}
      {theme === "dark" ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">切换主题</span>
    </Button>
  );
}
