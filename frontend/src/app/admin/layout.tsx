"use client";

import React from "react";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return <div className="min-h-screen bg-background">{children}</div>;
}
