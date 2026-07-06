import { Shield, ListChecks, Wrench } from "lucide-react";

import type { NavGroup } from "./nav";

/**
 * 管理后台侧边栏导航配置（仅管理员可见）
 *
 * 约束：
 * - 不得并入普通用户的 `sidebarNavConfig`
 * - 仅在 `/admin/*` 管理后台视图中渲染
 */
export const adminSidebarNavConfig: NavGroup[] = [
  {
    title: "总览",
    value: "admin",
    links: [
      {
        title: "后台首页",
        href: "/admin",
        icon: Shield,
      },
    ],
  },
  {
    title: "作业管理",
    value: "ops",
    links: [
      {
        title: "作业队列",
        href: "/admin/ops-jobs",
        icon: ListChecks,
      },
      {
        title: "统计修复",
        href: "/admin/works-stats-repair",
        icon: Wrench,
      },
    ],
  },
];
