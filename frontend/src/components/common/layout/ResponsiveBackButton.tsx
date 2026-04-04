"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@/components/ui/button";

interface ResponsiveBackButtonProps {
  href: string;
  label: string;
  className?: string;
}

export function ResponsiveBackButton({
  href,
  label,
  className,
}: ResponsiveBackButtonProps): React.ReactElement {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      onClick={() => router.push(href)}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
