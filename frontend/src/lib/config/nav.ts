import { Book, Feather, Home, Settings, Bot, Users, Globe, FileText } from "lucide-react";

export interface NavLink {
  title: string;
  href: string;
  icon: React.ElementType;
}

export interface NavGroup {
  title: string;
  value: string; // Unique value for Accordion item
  links: NavLink[];
}

/**
 * 侧边栏导航配置
 *
 * 设计原则:
 * - 数据驱动: UI 根据此配置动态生成，实现数据与视图分离。
 * - 分组: 通过 NavGroup 支持导航项的分组，便于管理和渲染。
 * - 类型安全: 使用 TypeScript 接口确保数据结构的正确性。
 */
export const sidebarNavConfig: NavGroup[] = [
  {
    title: "创作",
    value: "creation",
    links: [
      {
        title: "作品管理",
        href: "/works",
        icon: Book,
      },
      {
        title: "草稿箱",
        href: "/drafts",
        icon: Feather,
      },
    ],
  },
  {
    title: "工具",
    value: "tools",
    links: [
      {
        title: "AI 助手",
        href: "/tools/ai-assistant",
        icon: Bot,
      },
      {
        title: "提示词管理",
        href: "/tools/prompts",
        icon: FileText,
      },
    ],
  },
];

/**
 * 作品上下文导航配置工厂
 * 根据 workId 生成对应的导航链接
 */
export const getWorkNavConfig = (workId: string): NavGroup[] => [
  {
    title: "创作核心",
    value: "core",
    links: [
      { title: "章节管理", href: `/works/${workId}/chapters`, icon: Book },
      { title: "大纲规划", href: `/works/${workId}/outline`, icon: FileText },
    ],
  },
  {
    title: "世界观构建",
    value: "world",
    links: [
      { title: "角色管理", href: `/works/${workId}/characters`, icon: Users },
      { title: "世界设定", href: `/works/${workId}/world`, icon: Globe },
    ],
  },
  {
    title: "设置",
    value: "settings",
    links: [
      { title: "作品设置", href: `/works/${workId}/settings`, icon: Settings },
    ],
  },
];

/**
 * 独立的主页导航项
 * 单独导出以便在布局中灵活使用
 */
export const dashboardLink: NavLink = {
  title: "总览",
  href: "/dashboard", // Changed from "/" to "/dashboard" for consistency
  icon: Home,
};

/**
 * 独立的设置导航项
 * 单独导出以便在布局中灵活使用
 */
export const settingsLink: NavLink = {
  title: "设置",
  href: "/settings",
  icon: Settings,
};
