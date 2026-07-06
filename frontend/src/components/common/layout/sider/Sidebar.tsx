"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Globe,
  Settings,
  ChevronLeft,
  Sparkles,
  Bot,
  Feather,
  PenTool,
  Bell,
  Sun,
  Moon,
  User,
} from "lucide-react";

import { ThemeToggle } from "../ThemeToggle";
import { UserNav } from "../UserNav";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  sidebarNavConfig,
  dashboardLink,
  settingsLink,
  NavLink,
  getWorkNavConfig,
} from "@/lib/config/nav";

export function Sidebar({
  showExtraFooter = false,
}: {
  showExtraFooter?: boolean;
}) {
  const pathname = usePathname();
  const params = useParams();
  const workId = params.id as string;

  // 判断是否在作品上下文中 (路由包含 /works/[id])
  // 注意: /works 本身是列表页，不属于特定作品上下文
  const isWorkContext = useMemo(() => {
    return !!workId && pathname.startsWith(`/works/${workId}`);
  }, [pathname, workId]);

  const workNavConfig = useMemo(() => {
    return workId ? getWorkNavConfig(workId) : [];
  }, [workId]);

  return (
    <div className="flex h-full flex-col gap-4 py-4">
      {/* 上下文切换/返回按钮 */}
      {isWorkContext && (
        <div className="px-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-primary"
            asChild
          >
            <Link href="/works">
              <ChevronLeft className="h-4 w-4" />
              返回作品列表
            </Link>
          </Button>
          <Separator className="mt-4" />
        </div>
      )}

      <ScrollArea className="flex-1 px-2.5">
        <div className="space-y-5">
          {isWorkContext ? (
            <div className="space-y-5">
              {workNavConfig.map((group, index) => (
                <div key={index} className="space-y-1">
                  <h4 className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    {group.title}
                  </h4>
                  <div className="space-y-0.5">
                    {group.links.map((item) => (
                      <SidebarItem
                        key={item.href}
                        item={item}
                        isActive={pathname === item.href}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <SidebarItem
                  item={dashboardLink}
                  isActive={pathname === dashboardLink.href}
                />
              </div>

              {sidebarNavConfig.map((group) => (
                <div key={group.value} className="space-y-1">
                  <h4 className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    {group.title}
                  </h4>
                  <div className="space-y-0.5">
                    {group.links.map((link) => (
                      <SidebarItem
                        key={link.href}
                        item={link}
                        isActive={pathname.startsWith(link.href)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="mt-auto px-2.5 space-y-3">
        <Separator className="bg-[var(--border-subtle)]" />
        <SidebarItem
          item={settingsLink}
          isActive={pathname === settingsLink.href}
        />

        {/* 仅在移动端编辑器模式下显示，替代被隐藏的 Header 功能 */}
        {showExtraFooter && (
          <div className="space-y-1 animate-in fade-in slide-in-from-bottom-4 pt-2">
            {/* 主题切换行 */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <div className="flex items-center gap-3">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>主题设置</span>
              </div>
              <ThemeToggle />
            </div>

            {/* 通知行 */}
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2.5 h-auto font-medium text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span>消息通知</span>
              <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500" />
            </Button>

            {/* 用户行 */}
            <div className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <span>个人中心</span>
              </div>
              <UserNav />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarItem({ item, isActive }: { item: NavLink; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-[var(--primary-50)] text-[var(--primary-700)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--neutral-100)] hover:text-[var(--text-primary)]",
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 transition-colors",
          isActive
            ? "text-[var(--primary-600)]"
            : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]",
        )}
      />
      <span>{item.title}</span>
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 h-5 w-0.5 rounded-r-full bg-[var(--primary-500)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </Link>
  );
}
