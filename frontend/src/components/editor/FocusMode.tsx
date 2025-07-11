"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";

interface FocusModeProps {
  editorContainerId: string;
}

export function FocusMode({ editorContainerId }: FocusModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 切换全屏模式
  const toggleFullscreen = () => {
    const editorContainer = document.getElementById(editorContainerId);
    if (!editorContainer) return;

    if (!isFullscreen) {
      // 进入全屏模式
      if (editorContainer.requestFullscreen) {
        editorContainer.requestFullscreen();
      }
    } else {
      // 退出全屏模式
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleFullscreen}
      className="gap-1"
      title={isFullscreen ? "退出专注模式" : "进入专注模式"}
    >
      {isFullscreen ? (
        <>
          <Minimize2 className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:inline-block">
            退出专注模式
          </span>
        </>
      ) : (
        <>
          <Maximize2 className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:inline-block">
            专注模式
          </span>
        </>
      )}
    </Button>
  );
}
