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
  PenTool
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { sidebarNavConfig, dashboardLink, settingsLink, NavLink } from "@/lib/config/nav";

// === Work Context Navigation ===
const getWorkNavLinks = (workId: string): { title: string; items: NavLink[] }[] => [
  {
    title: "创作核心",
    items: [
      { title: "章节管理", href: `/works/${workId}`, icon: BookOpen },
      { title: "大纲规划", href: `/works/${workId}/outline`, icon: FileText },
    ],
  },
  {
    title: "世界观构建",
    items: [
      { title: "角色管理", href: `/works/${workId}/characters`, icon: Users },
      { title: "世界设定", href: `/works/${workId}/world`, icon: Globe },
    ],
  },
  {
    title: "设置",
    items: [
      { title: "作品设置", href: `/works/${workId}/settings`, icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const params = useParams();
  const workId = params.id as string;

  // 判断是否在作品上下文中 (路由包含 /works/[id])
  // 注意: /works 本身是列表页，不属于特定作品上下文
  const isWorkContext = useMemo(() => {
    return !!workId && pathname.startsWith(`/works/${workId}`);
  }, [pathname, workId]);

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

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6">
          {isWorkContext ? (
            // === 作品上下文导航 ===
            <div className="space-y-6">
              {getWorkNavLinks(workId).map((group, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <SidebarItem key={item.href} item={item} isActive={pathname === item.href} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // === 全局导航 ===
            <div className="space-y-6">
              {/* 仪表盘 */}
              <div className="space-y-1">
                <SidebarItem
                  item={dashboardLink}
                  isActive={pathname === dashboardLink.href}
                />
              </div>

              {/* 分组导航 */}
              {sidebarNavConfig.map((group) => (
                <div key={group.value} className="space-y-2">
                  <h4 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </h4>
                  <div className="space-y-1">
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

      {/* 底部设置 */}
      <div className="mt-auto px-3">
        <Separator className="mb-4" />
        <SidebarItem
          item={settingsLink}
          isActive={pathname === settingsLink.href}
        />
      </div>
    </div>
  );
}

function SidebarItem({ item, isActive }: { item: NavLink; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 transition-colors",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      <span>{item.title}</span>
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 h-6 w-1 rounded-r-full bg-primary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </Link>
  );
}
