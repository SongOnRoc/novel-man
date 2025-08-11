import { MainLayoutGuard } from "@/components/common/layout/MainLayoutGuard";

/**
 * This layout wraps all main application routes.
 * Context providers are attached at the root layout. Avoid duplicating here.
 * Route guarding and main shell are delegated to MainLayoutGuard.
 */
export default function MainRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayoutGuard>{children}</MainLayoutGuard>;
}
