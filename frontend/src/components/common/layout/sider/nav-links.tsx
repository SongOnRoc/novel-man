"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Users,
  Globe2,
  Sparkles,
  Settings
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  sidebarNavConfig,
  settingsLink,
  dashboardLink,
  NavGroup,
  NavLink,
} from "@/lib/config/nav";
import { cn } from "@/lib/utils";
import { useSidebarContext } from "@/hooks/ui/useSidebarContext";

const MotionLink = motion.create(Link);

const navLinkTextVariants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.1, ease: "easeIn" as const },
  },
};

const accordionContentVariants = {
  initial: { opacity: 0, height: 0 },
  animate: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.3, ease: "easeInOut" as const },
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" as const },
  },
};

interface NavLinksProps {
  isCollapsed: boolean;
}

const renderNavLink = (
  link: NavLink,
  pathname: string,
  isCollapsed: boolean,
  closeSheet?: () => void
) => {
  const isActive = pathname === link.href;

  if (isCollapsed) {
    return (
      <Tooltip key={link.href} delayDuration={0}>
        <TooltipTrigger asChild>
          <MotionLink
            href={link.href}
            onClick={closeSheet}
            className={cn(
              "group relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all duration-300 hover:text-foreground hover:shadow-lg hover:scale-105",
              isActive
                ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary border border-primary/20 shadow-md"
                : "hover:bg-primary/10"
            )}
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95 }}
          >
            <link.icon
              className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:text-primary"
              strokeWidth={2}
            />
            <span className="sr-only">{link.title}</span>
            {/* 添加活动状态指示器 */}
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-sm" />
            )}
          </MotionLink>
        </TooltipTrigger>
        <TooltipContent side="right">{link.title}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <MotionLink
      key={link.href}
      href={link.href}
      onClick={closeSheet}
      className={cn(
        "group relative flex items-center justify-between rounded-xl px-4 py-3 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:shadow-md hover:translate-x-1",
        isActive
          ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary border border-primary/20 shadow-sm"
          : "hover:border-border/40"
      )}
      whileHover={{
        x: 4,
        transition: { type: "spring", stiffness: 400, damping: 10 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 添加活动状态指示器 */}
      {isActive && (
        <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-sm" />
      )}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            key="nav-link-text"
            variants={navLinkTextVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="truncate font-medium"
          >
            {link.title}
          </motion.span>
        )}
      </AnimatePresence>
      <link.icon
        className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:text-primary"
        strokeWidth={2}
      />
    </MotionLink>
  );
};

export function NavLinks({ isCollapsed }: NavLinksProps) {
  const pathname = usePathname();
  const { closeSheet } = useSidebarContext();

  if (isCollapsed) {
    const allLinks = sidebarNavConfig.flatMap((group) => group.links);
    // 创建带有更新图标的链接
    const updatedDashboardLink = { ...dashboardLink, icon: LayoutDashboard };
    const updatedAllLinks = allLinks.map((link, index) => {
      if (link.href === "/works") return { ...link, icon: BookOpen };
      if (link.href === "/drafts") return { ...link, icon: FileText };

      if (link.href === "/tools/ai-assistant") return { ...link, icon: Sparkles };
      return link;
    });
    const updatedSettingsLink = { ...settingsLink, icon: Settings };
    
    return (
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-3 px-3 py-6">
          <div className="flex flex-col items-center gap-2">
            {renderNavLink(updatedDashboardLink, pathname, true, closeSheet)}
            <div className="h-px w-8 bg-border/30 my-1" />
            {updatedAllLinks.map((link) =>
              renderNavLink(link, pathname, true, closeSheet)
            )}
          </div>
          <div className="mt-auto flex flex-col items-center gap-2 pt-4 border-t border-border/30">
            {renderNavLink(updatedSettingsLink, pathname, true, closeSheet)}
          </div>
        </nav>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <nav className="space-y-2 p-3">
        {/* 使用更新后的图标 */}
        {renderNavLink({ ...dashboardLink, icon: LayoutDashboard }, pathname, false, closeSheet)}
        <div className="h-px bg-border/30 my-2" />
        <Accordion
          type="multiple"
          defaultValue={sidebarNavConfig.map((g) => g.value)}
          className="w-full space-y-1"
        >
          {sidebarNavConfig.map((group: NavGroup) => (
            <AccordionItem
              value={group.value}
              key={group.value}
              className="border-none rounded-xl overflow-hidden bg-background/40 backdrop-blur-sm border border-border/20 shadow-sm"
            >
              <AccordionTrigger className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:no-underline hover:text-primary transition-all duration-300 [&[data-state=open]>svg]:rotate-180 [&[data-state=open]]:bg-primary/10 [&[data-state=open]]:text-primary">
                <span className="font-semibold">{group.title}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <AnimatePresence initial={false}>
                  <motion.div
                    key="content"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={accordionContentVariants}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-1 px-2 pt-1">
                      {group.links.map((link) => {
                        // 更新每个链接的图标
                        let updatedLink = link;
                        if (link.href === "/works") updatedLink = { ...link, icon: BookOpen };
                        if (link.href === "/drafts") updatedLink = { ...link, icon: FileText };

                        if (link.href === "/tools/ai-assistant") updatedLink = { ...link, icon: Sparkles };
                        return renderNavLink(updatedLink, pathname, false, closeSheet);
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
      <div className="mt-auto p-3 border-t border-border/30">
        {renderNavLink({ ...settingsLink, icon: Settings }, pathname, false, closeSheet)}
      </div>
    </div>
  );
}
