"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { adminSidebarNavConfig } from "@/lib/config/admin-nav";
import { cn } from "@/lib/utils";

export function AdminSidebar(): React.ReactElement {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[280px] flex-col border-r bg-[linear-gradient(180deg,hsl(var(--sidebar))_0%,hsl(var(--background))_100%)]">
      <div className="space-y-4 border-b px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="text-base font-semibold tracking-tight text-foreground">
              Admin Console
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl border bg-background/70 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
          <span>独立认证域</span>
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
            Admin
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {adminSidebarNavConfig.map((group) => (
            <div key={group.value} className="space-y-2">
              <h4 className="px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                {group.title}
              </h4>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const active = pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200",
                        active
                          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/15"
                          : "text-muted-foreground hover:bg-background/80 hover:text-foreground hover:shadow-sm"
                      )}
                    >
                      <link.icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          active
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      <span>{link.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t px-4 py-4">
        <Separator />
      </div>
    </aside>
  );
}
