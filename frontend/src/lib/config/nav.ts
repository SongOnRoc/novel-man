import { Book, Feather, Home, Settings, Bot, Users, Globe } from "lucide-react";

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
        title: "总览",
        href: "/",
        icon: Home,
      },
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
        title: "角色管理",
        href: "/tools/characters",
        icon: Users,
      },
      {
        title: "世界观设定",
        href: "/tools/worldbuilding",
        icon: Globe,
      },
      {
        title: "AI 助手",
        href: "/tools/ai-assistant",
        icon: Bot,
      },
    ],
  },
];

/**
 * 独立的设置导航项
 * 单独导出以便在布局中灵活使用
 */
export const settingsLink: NavLink = {
  title: "设置",
  href: "/settings",
  icon: Settings,
};
