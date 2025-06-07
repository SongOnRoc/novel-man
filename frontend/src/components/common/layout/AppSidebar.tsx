"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  BookOpenText, // 书籍图标
  FileText, // 文件图标
  Home, // 首页图标
  Library, // 图书馆图标
  Settings, // 设置图标
  PenTool, // 笔工具图标
  Menu, // 菜单图标
} from "lucide-react"; // 导入图标组件
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // 导入抽屉组件
import { Button } from "@/components/ui/button"; // 导入按钮组件
import { Separator } from "@/components/ui/separator"; // 导入分隔线组件
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // 导入提示组件
import { ThemeSwitcher } from "../ThemeSwitcher";

type NavItem = {
  title: string; // 导航项标题
  href: string; // 导航项链接
  icon: React.ElementType; // 导航项图标组件类型
};

const navItems: NavItem[] = [
  { title: "首页", href: "/", icon: Home },
  { title: "我的作品", href: "/works", icon: Library },
  { title: "章节管理", href: "/chapters", icon: BookOpenText },
  { title: "草稿箱", href: "/drafts", icon: FileText },
  { title: "写作工具", href: "/tools", icon: PenTool },
  { title: "设置", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <>
      {/* 桌面端侧边栏 - 在中等屏幕及以上显示 */}
      <div className="hidden h-screen w-16 flex-col border-r bg-background md:flex">
        <div className="flex h-16 items-center justify-center border-b">
          {/* 应用logo */}
          <Link href="/" className="flex items-center justify-center">
            <PenTool className="h-6 w-6 text-primary" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-4 p-4">
          {/* 导航项列表 */}
          {navItems.map((item) => (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    // 可以根据当前路径添加激活状态
                    // pathname === item.href && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.title}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.title}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <div className="flex flex-col gap-4 p-4">
          <ThemeSwitcher />
          {/* 用户头像或登录按钮可以放在这里 */}
        </div>
      </div>

      {/* 移动端侧边栏 - 在中等屏幕以下显示 */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-40 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">打开菜单</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex h-16 items-center border-b">
            <Link href="/" className="flex items-center gap-2">
              <PenTool className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">小说管理系统</span>
            </Link>
          </div>
          <nav className="flex flex-col gap-2 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  // 可以根据当前路径添加激活状态
                  // pathname === item.href && "bg-accent text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
          <Separator />
          <div className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">切换主题</span>
              <ThemeSwitcher />
            </div>
            {/* 用户信息或登录按钮可以放在这里 */}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
