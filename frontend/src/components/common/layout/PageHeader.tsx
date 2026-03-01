"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string | React.ReactNode;
  showBackButton?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export const PageHeader = ({
  title,
  description,
  showBackButton = true,
  backHref,
  actions,
}: PageHeaderProps): React.ReactElement => {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (backHref) {
                router.push(backHref);
                return;
              }
              router.back();
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">返回</span>
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};