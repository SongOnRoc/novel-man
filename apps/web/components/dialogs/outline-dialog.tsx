"use client";
import useLocalStorage from "@/hooks/use-local-storage";
import { APP_THEME_COLORS } from "@/lib/theme-config";
import { X } from "lucide-react";

interface OutlineDialogContentProps {
  onClose: () => void;
}

export function OutlineDialogContent({ onClose }: OutlineDialogContentProps) {
  const [selectedBg] = useLocalStorage<string>("novel__background-color", "white");
  return (
    <div
      className={`app-dialog-theme fixed bottom-0 left-0 right-0 w-full flex flex-col p-4 rounded-t-lg shadow-lg z-20 border-t border-[color:var(--app-divider-border)] ${APP_THEME_COLORS.find((tc) => tc.value === selectedBg)?.applyClass || "bg-white"} max-h-[80vh] overflow-y-auto`}
    >
      {/* Header with Close Button */}
      <div className="sticky top-0 z-10 flex justify-between items-center mb-4 pb-2 border-b border-[color:var(--app-divider-border)] bg-[color:var(--app-card-bg)]">
        {/* Replaced DialogTitle with h2 */}
        <h2 className="text-lg font-semibold text-[color:var(--app-title-color)]">作品大纲</h2>
        <div className="flex items-center gap-4">
          <button type="button" className="text-[color:var(--app-toggle-on-bg)] font-semibold">
            保存
          </button>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-[color:var(--app-hover-bg)]">
            <X className="h-5 w-5 text-[color:var(--app-icon-color)]" />
          </button>
        </div>
      </div>
      {/* Body */}
      <div className="space-y-6 overflow-y-auto flex-1">
        {" "}
        {/* Make body scrollable */}
        {/* Worldview */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-[color:var(--app-section-title-color)]">世界观</h3>
          <div className="space-y-3 rounded-md bg-[color:var(--app-card-bg)] p-3 shadow-sm">
            <div className="text-sm text-[color:var(--app-section-title-color)]">世界背景</div>
            <div className="text-sm text-[color:var(--app-text-color)]">描述世界的基本历史、风土人情</div>
          </div>
          <div className="space-y-3 rounded-md bg-[color:var(--app-card-bg)] p-3 shadow-sm">
            <div className="text-sm text-[color:var(--app-section-title-color)]">金手指</div>
            <div className="text-sm text-[color:var(--app-text-color)]">
              主角独有的能力或特质，能够起到推动剧情，解决矛盾危机的作用
            </div>
          </div>
          <div className="space-y-3 rounded-md bg-[color:var(--app-card-bg)] p-3 shadow-sm">
            <div className="text-sm text-[color:var(--app-section-title-color)]">背景事件</div>
            {/* Add content here */}
          </div>
        </div>
        {/* Characters */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-[color:var(--app-section-title-color)]">角色</h3>
          <div className="space-y-3 rounded-md bg-[color:var(--app-card-bg)] p-3 shadow-sm">
            <div className="text-sm text-[color:var(--app-section-title-color)]">主角</div>
            <div className="text-sm text-[color:var(--app-text-color)] space-y-1">
              <div>姓名:</div>
              <div>性别:</div>
              <div>性格:</div>
              <div>外貌:</div>
              <div>人物简介:</div>
              <div>人物关系:</div>
            </div>
          </div>
          {/* Add other characters here */}
        </div>
        {/* Plot Outline */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-[color:var(--app-section-title-color)]">剧情大纲</h3>
          <div className="space-y-3 rounded-md bg-[color:var(--app-card-bg)] p-3 shadow-sm">
            <div className="text-sm text-[color:var(--app-section-title-color)]">主线</div>
            <div className="text-sm text-[color:var(--app-text-color)]">
              主角的主要目标，主线故事的起因、经过、结果。
            </div>
          </div>
          <div className="space-y-3 rounded-md bg-[color:var(--app-card-bg)] p-3 shadow-sm">
            <div className="text-sm text-[color:var(--app-section-title-color)]">支线</div>
            <div className="text-sm text-[color:var(--app-text-color)]">
              主角的次要目标，支线故事的起因、经过、结果。支线通常是依附于主线目标，将主线目标拆分成若干
            </div>
          </div>
          {/* Add other plot points here */}
        </div>
      </div>
      {/* Floating button (Placeholder) - Adjusted position */}
      <div className="sticky bottom-4 right-4 self-end mt-4">
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-[color:var(--app-toggle-on-bg)] text-[color:var(--app-toggle-thumb-bg)] flex items-center justify-center shadow-lg"
        >
          <span className="text-lg">☰</span>
        </button>
      </div>
    </div>
  );
}
