"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
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
  NavGroup,
  NavLink,
} from "@/lib/config/nav";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(Link);

const navLinkTextVariants = {
  initial: { opacity: 0, x: -10 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.1, ease: "easeIn" as const } },
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
  isCollapsed: boolean
) => {
  const isActive = pathname === link.href;

  if (isCollapsed) {
    return (
      <Tooltip key={link.href} delayDuration={0}>
        <TooltipTrigger asChild>
          <MotionLink
            href={link.href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
              isActive && "bg-accent text-accent-foreground"
            )}
            whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
          >
            <link.icon className="h-5 w-5" />
            <span className="sr-only">{link.title}</span>
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
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
      whileHover={{
        x: 4,
        transition: { type: "spring", stiffness: 400, damping: 10 },
      }}
    >
      <link.icon className="h-4 w-4" />
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            key="nav-link-text"
            variants={navLinkTextVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="truncate"
          >
            {link.title}
          </motion.span>
        )}
      </AnimatePresence>
    </MotionLink>
  );
};

export function NavLinks({ isCollapsed }: NavLinksProps) {
  const pathname = usePathname();

  if (isCollapsed) {
    const allLinks = sidebarNavConfig.flatMap((group) => group.links);
    return (
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-2 px-2 py-4">
          <div className="flex flex-col items-center gap-1">
            {allLinks.map((link) => renderNavLink(link, pathname, true))}
          </div>
          <div className="mt-auto flex flex-col items-center gap-2">
            {renderNavLink(settingsLink, pathname, true)}
          </div>
        </nav>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <nav className="flex-1 space-y-1 p-2">
        <Accordion
          type="multiple"
          defaultValue={sidebarNavConfig.map((g) => g.value)}
          className="w-full"
        >
          {sidebarNavConfig.map((group: NavGroup) => (
            <AccordionItem
              value={group.value}
              key={group.value}
              className="border-none"
            >
              <AccordionTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:no-underline [&[data-state=open]>svg]:rotate-180">
                {group.title}
              </AccordionTrigger>
              <AccordionContent>
                <AnimatePresence initial={false}>
                  <motion.div
                    key="content"
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={accordionContentVariants}
                    className="overflow-hidden"
                  >
                    <div className="grid gap-1 pb-1 pl-4 pt-1">
                      {group.links.map((link) =>
                        renderNavLink(link, pathname, false)
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
      <div className="mt-auto p-2">
        {renderNavLink(settingsLink, pathname, false)}
      </div>
    </div>
  );
}
