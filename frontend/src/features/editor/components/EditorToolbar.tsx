"use client";

import { Editor } from "@tiptap/react";
import { Expand, Shrink, Save, Check, AlertCircle, Loader2, ArrowLeft, Upload, Info, Undo2, Redo2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EditorSettings as EditorSettingsType,
  defaultEditorSettings,
} from "@/types/editor";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { EditorSettings } from "./EditorSettings";
import { UnifiedSearchButton } from "./UnifiedSearchButton";
import { TreasureChest } from "./TreasureChest";
import { SaveStatus } from "./TiptapEditor";

interface EditorToolbarProps {
  editor: Editor | null;
  title: string;
  onSave?: () => void;
  saveStatus?: SaveStatus;
  wordCount?: number;
  contentId?: string;
  workId?: string;
  editorContainerId: string;
  targetCount?: number;
  onTargetCountChange?: (newTarget: number) => void;
  settings: EditorSettingsType;
  onSettingsChange: (settings: EditorSettingsType) => void;
  onApply?: () => void;
  onBack?: () => void;
  onPublish?: () => void;
}

const InfoIcon = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center w-3.5 h-3.5 rounded-full text-[10px] font-bold font-serif leading-none select-none", className)}>
    i
  </div>
);

export function EditorToolbar({
  editor,
  title,
  onSave,
  saveStatus = 'saved',
  wordCount =  0,
  contentId = "temp",
  workId,
  editorContainerId,
  targetCount = 0,
  onTargetCountChange,
  settings,
  onSettingsChange,
  onApply,
  onBack,
  onPublish,
}: EditorToolbarProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    const elem = document.getElementById(editorContainerId);
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch((err) => {
        alert(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
  }, []);

  if (!editor) {
    return null;
  }

  const getSaveStatusDisplay = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <Button variant="ghost" size="sm" className="h-auto py-0 px-0 gap-1 text-blue-500 hover:text-blue-600 hover:bg-transparent cursor-default" disabled>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>保存中</span>
          </Button>
        );
      case 'saved':
        if (onPublish) {
          return (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-0 px-0 gap-1 text-green-600 hover:text-green-700 hover:bg-transparent cursor-pointer group"
              onClick={onPublish}
            >
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div 
                      className="mr-0.5 cursor-help"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Mobile support
                        if (window.matchMedia('(max-width: 768px)').matches) {
                           toast.info("当前内容已保存。您可以随时点击已保存按钮将草稿发布为正式章节。", {
                            duration: 3000,
                            position: "top-center"
                          });
                        }
                      }}
                    >
                      <InfoIcon className="bg-zinc-400 text-white/90" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs bg-card text-card-foreground border shadow-sm">
                    <p className="text-sm font-normal">
                      当前内容已保存。
                      <br />
                      您可以随时点击<span className="font-bold text-green-600 mx-1">已保存</span>按钮将草稿发布为正式章节。
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span>已保存</span>
            </Button>
          );
        }
        return (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-auto py-0 px-0 gap-1 text-green-600 hover:text-green-700 hover:bg-transparent cursor-default"
            title="已保存"
          >
            <Check className="h-3 w-3" />
            <span>已保存</span>
          </Button>
        );
      case 'unsaved':
          return (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-auto py-0 px-0 gap-1 text-yellow-600 hover:text-yellow-700 hover:bg-transparent cursor-pointer"
              onClick={onSave}
              title="点击保存"
            >
              <InfoIcon className="bg-yellow-500 text-white mr-0.5" />
              <span>未保存</span>
            </Button>
          );
      case 'error':
        return (
          <Button 
            variant="ghost" 
            size="sm"
            className="h-auto py-0 px-0 gap-1 text-red-500 hover:text-red-600 hover:bg-transparent cursor-pointer"
            onClick={onSave}
            title="点击重试保存"
          >
            <AlertCircle className="h-3 w-3" />
            <span>保存失败</span>
          </Button>
        );
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {/* 返回按钮 */}
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
          title="返回"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}
      
      {/* 撤销/重做按钮 */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="撤销"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="重做"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      {/* 统一查找按钮 */}
      <UnifiedSearchButton editor={editor} workId={workId} />

      {/* 百宝箱 */}
      <TreasureChest editor={editor} title={title} />

      {/* 右侧操作区 */}
      <div className="flex items-center gap-1 sm:gap-3 ml-auto">

        {/* 状态显示：保存状态 | 字数 */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground select-none bg-muted/30 px-2 sm:px-3 py-1.5 rounded-full border border-border/50">
          {getSaveStatusDisplay()}
          <span className="font-mono text-sm">{wordCount} 字</span>
        </div>

        <EditorSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
          onApply={onApply}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullScreen}
          className="h-8 w-8 hidden sm:inline-flex"
          title={isFullScreen ? "退出全屏" : "全屏模式"}
        >
          {isFullScreen ? (
            <Shrink className="h-4 w-4" />
          ) : (
            <Expand className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

