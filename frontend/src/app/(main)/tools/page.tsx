"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ToolsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/tools/characters");
  }, [router]);

  return null; // or a loading spinner
}