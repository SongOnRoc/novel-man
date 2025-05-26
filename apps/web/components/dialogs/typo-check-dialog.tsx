"use client";

import useLocalStorage from "@/hooks/use-local-storage";
import { APP_THEME_COLORS } from "@/lib/theme-config";
// Removed: import { DialogTitle } from "@radix-ui/react-dialog";
// import { Label } from "@/components/tailwind/ui/label"; // Commented out - Component likely missing
// import { RadioGroup, RadioGroupItem } from "@/components/tailwind/ui/radio-group"; // Commented out - Component likely missing
import { X } from "lucide-react";

// Placeholder for the illustration component/element
const EmptyBoxIllustration = () => (
  <div className="my-8 text-center text-[color:var(--app-icon-color)]">
    {/* Basic SVG placeholder */}
    <svg
      className="mx-auto h-24 w-24"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-labelledby="emptyBoxTitle"
    >
      <title id="emptyBoxTitle">Empty Box Illustration</title> {/* Added title for accessibility */}
      <path d="M20 30 L80 30 L70 70 L30 70 Z" stroke="currentColor" strokeWidth="2" />
      <path d="M30 30 L40 15 L60 15 L70 30" stroke="currentColor" strokeWidth="2" />
      <path d="M45 45 Q 50 55 55 45" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      <path d="M40 55 Q 50 65 60 55" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
    {/* Replace with actual illustration if available */}
  </div>
);

interface TypoCheckDialogContentProps {
  onClose: () => void;
}

export function TypoCheckDialogContent({ onClose }: TypoCheckDialogContentProps) {
  const [selectedBg] = useLocalStorage<string>("novel__background-color", "white");
  return (
    <div
      className={`app-dialog-theme fixed bottom-0 left-0 right-0 w-full flex flex-col p-4 rounded-t-lg shadow-lg z-20 border-t border-[color:var(--app-divider-border)] ${APP_THEME_COLORS.find((tc) => tc.value === selectedBg)?.applyClass || "bg-white"}`}
    >
      {/* Header with Close Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-[color:var(--app-title-color)]">
          错别字・<span className="text-[color:var(--app-text-color)]">0</span>
        </h2>
        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[color:var(--app-hover-bg)]">
          <X className="h-5 w-5 text-[color:var(--app-icon-color)]" />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col items-center justify-center text-center bg-[color:var(--app-card-bg)] rounded-lg p-4">
        <EmptyBoxIllustration />
        <p className="text-[color:var(--app-text-color)]">暂无错别字</p>
      </div>
    </div>
  );
}
