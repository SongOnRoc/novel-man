import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { ResponsiveBackButton } from "./ResponsiveBackButton";

interface PageHeaderBackButtonConfig {
  href: string;
  label: string;
}

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  backButton?: PageHeaderBackButtonConfig;
  actions?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  showBackButton = true,
  backHref,
  backButton,
  actions,
}: PageHeaderProps): React.ReactElement => {
  const router = useRouter();
  const resolvedBackButton = backButton ?? (showBackButton && backHref
    ? { href: backHref, label: "返回" }
    : null);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        {resolvedBackButton ? (
          <ResponsiveBackButton
            href={resolvedBackButton.href}
            label={resolvedBackButton.label}
            className="h-10 shrink-0 px-3"
          />
        ) : showBackButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="返回"
            title="返回"
            className="h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
    </div>
  );
};
