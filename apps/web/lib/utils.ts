import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { toast } from "sonner"; // Import toast notifications

// Helper function for fallback text selection and notification
function selectTextFallback(text: string) {
  const element = document.createElement("textarea");
  element.value = text;
  document.body.appendChild(element);
  element.select();
  document.execCommand("copy");
  document.body.removeChild(element);
  toast.success("已复制到剪贴板");
}

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("已复制到剪贴板");
    } catch (err) {
      console.error("Failed to copy using clipboard API:", err);
      selectTextFallback(text);
    }
  } else {
    // Fallback: select text and ask user to copy if clipboard API is not available
    selectTextFallback(text);
  }
}

export const toastUnavailable = () => {
  toast.error("当前区域以后再来探索吧>.<");
};
