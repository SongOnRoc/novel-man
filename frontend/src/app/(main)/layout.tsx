import { MainLayout } from "@/components/common/layout/MainLayout"; // 导入主布局组件

// 主路由组布局
export default function MainRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}
