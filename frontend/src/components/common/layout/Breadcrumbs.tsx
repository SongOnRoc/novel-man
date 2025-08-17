"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

/**
 * Breadcrumbs
 * - Purpose: 显示当前路由层级的可导航“面包屑”，提升信息架构可见性与可达性
 * - 设计规范：
 *   - 移动优先：在小屏隐藏（避免占用有限横向空间），md 及以上展示
 *   - 可访问性（A11y）：使用 nav[aria-label="Breadcrumb"] + 有序列表 <ol> 语义
 *   - 设计系统：采用 Tailwind 语义色（text-muted-foreground、text-foreground）与动效
 * - 数据来源：
 *   - 使用 Next.js App Router 的 usePathname() 解析当前路径
 *   - 使用 LABEL_MAP 对已知段落进行本地化映射，未知段落退化为解码后的原值
 * - 使用位置建议：
 *   - 放置于 Header 左侧区域（导航/操作区左边），保证信息层级清晰
 */

// 已知路径段的本地化映射（可按需持续扩充）
const LABEL_MAP: Record<string, string> = {
  works: "作品",
  drafts: "草稿",
  chapters: "章节",
  settings: "设置",
  tools: "工具",
  characters: "角色",
  worldview: "世界观",
  dashboard: "仪表盘",
  ai: "AI",
  "ai-assistant": "AI助手",
  new: "新建",
  edit: "编辑",
  outline: "大纲",
};

/**
 * 将 URL 段转换为更友好的标题
 * - 纯数字段（常见于 id）以 #123 的形式展示
 * - 其他段尝试 URI 解码，失败则回退原始值
 */
function titleOf(segment: string): string {
  if (LABEL_MAP[segment]) return LABEL_MAP[segment];
  if (/^\d+$/.test(segment)) return `#${segment}`;
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

/**
 * Breadcrumbs 组件
 * @param className - 额外 class，用于在不同容器内微调布局间距
 *
 * 渲染策略：
 * - 小屏隐藏（hidden md:flex），在内容密集区域避免拥挤
 * - 使用“/”作为分隔符，最后一个面包屑为当前页，使用更醒目的前景色与字重
 */
export function Breadcrumbs({ className = "" }: { className?: string }) {
  // 当前路径，例如：/works/123/edit
  const pathname = usePathname() || "/";

  // 拆分路径为段（去除首尾斜杠后的空段）
  const segments = pathname.split("/").filter(Boolean);

  // 为每个段构造“累积路径”，用于分级导航
  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const label = titleOf(seg);
    const isLast = idx === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    // 小屏隐藏；从 md 断点开始展示
    <nav
      aria-label="Breadcrumb"
      className={`hidden md:flex items-center text-sm text-muted-foreground ${className}`}
    >
      <ol className="flex items-center gap-1">
        {/* 首页锚点 */}
        <li>
          <Link href="/" className="hover:text-foreground transition-colors">
            首页
          </Link>
        </li>

        {/* 动态段：中间段可点击跳转，最后一段仅展示当前层级 */}
        {crumbs.map((c) => (
          <React.Fragment key={c.href}>
            {/* 分隔符（仅作视觉分隔，使用 aria-hidden 避免无意义读屏输出） */}
            <li aria-hidden="true" className="px-1">
              /
            </li>
            <li>
              {c.isLast ? (
                <span className="text-foreground font-medium">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="hover:text-foreground transition-colors"
                >
                  {c.label}
                </Link>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}