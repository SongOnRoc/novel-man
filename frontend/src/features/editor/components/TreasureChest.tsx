"use client";

import { useState } from "react";
import { Editor } from "@tiptap/react";
import { 
  Briefcase, 
  Copy, 
  Download, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  ChevronLeft,
  X
} from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface TreasureChestProps {
  editor: Editor | null;
  title: string;
}

export function TreasureChest({ editor, title }: TreasureChestProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"main" | "export">("main");
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);
  
  // Export states
  const [includeTitle, setIncludeTitle] = useState(true);
  const [exportFormat, setExportFormat] = useState<"txt" | "image">("txt");
  const [isExporting, setIsExporting] = useState(false);

  if (!editor) return null;

  const handleCopy = async () => {
    try {
      const text = editor.getText();
      if (!text) {
        toast.warning("编辑器内容为空");
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("正文已复制到剪贴板");
      setIsOpen(false);
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("复制失败");
    }
  };

  const handleClear = () => {
    editor.chain().focus().selectAll().deleteSelection().run();
    setIsClearAlertOpen(false);
    setIsOpen(false);
    toast.success("内容已清空");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const safeTitle = title.trim() || "未命名草稿";
      
      if (exportFormat === "txt") {
        let content = editor.getText();
        if (includeTitle) {
          content = `${safeTitle}\n\n${content}`;
        }
        
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${safeTitle}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("导出 TXT 成功");
      } else {
        const element = document.getElementById("editor-paper-content");
        if (!element) throw new Error("找不到编辑器内容区域");

        const titleElement = element.querySelector("#title-input-container") as HTMLElement;
        const originalDisplay = titleElement ? titleElement.style.display : "";
        
        if (!includeTitle && titleElement) {
          titleElement.style.display = "none";
        }

        try {
          const dataUrl = await toPng(element, {
            quality: 0.95,
            backgroundColor: getComputedStyle(element).backgroundColor,
            style: { height: 'auto', overflow: 'visible' }
          });
          
          const link = document.createElement("a");
          link.download = `${safeTitle}.png`;
          link.href = dataUrl;
          link.click();
          toast.success("导出图片成功");
        } finally {
          if (!includeTitle && titleElement) {
            titleElement.style.display = originalDisplay;
          }
        }
      }
      setIsOpen(false);
      setView("main");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const resetView = () => {
    setTimeout(() => setView("main"), 300);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetView();
      }}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            title="百宝箱"
          >
            <Briefcase className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden bg-card border-border">
          {view === "main" ? (
            <>
              <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-xl font-semibold">百宝箱</DialogTitle>
                <DialogDescription>
                  常用的编辑工具集合
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 pt-4 grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 space-y-2 hover:bg-accent hover:text-accent-foreground border-muted-foreground/20"
                  onClick={() => setView("export")}
                >
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Download className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">导出作品</div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      支持 TXT 和长图分享
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 space-y-2 hover:bg-accent hover:text-accent-foreground border-muted-foreground/20"
                  onClick={handleCopy}
                >
                  <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                    <Copy className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">复制正文</div>
                    <div className="text-xs text-muted-foreground font-normal mt-0.5">
                      复制纯文本到剪贴板
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 space-y-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border-muted-foreground/20 col-span-2"
                  onClick={() => {
                    setIsOpen(false);
                    setTimeout(() => setIsClearAlertOpen(true), 150);
                  }}
                >
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">清空正文</div>
                    <div className="text-xs text-muted-foreground/80 font-normal mt-0.5">
                      慎用：将清空编辑器内的正文内容
                    </div>
                  </div>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center p-4 border-b">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="-ml-2 h-8 w-8 mr-2" 
                  onClick={() => setView("main")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold">导出设置</div>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between space-x-2 p-3 rounded-lg border bg-muted/30">
                  <Label htmlFor="include-title" className="flex flex-col space-y-1 cursor-pointer">
                    <span className="font-medium">包含标题</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      在导出文件中包含章节标题
                    </span>
                  </Label>
                  <Switch
                    id="include-title"
                    checked={includeTitle}
                    onCheckedChange={setIncludeTitle}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground ml-1">导出格式</Label>
                  <RadioGroup 
                    value={exportFormat} 
                    onValueChange={(v) => setExportFormat(v as "txt" | "image")}
                    className="grid grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="txt" id="format-txt" className="peer sr-only" />
                      <Label
                        htmlFor="format-txt"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                      >
                        <FileText className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                        <span className="font-medium">TXT 文本</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="image" id="format-image" className="peer sr-only" />
                      <Label
                        htmlFor="format-image"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                      >
                        <ImageIcon className="mb-3 h-6 w-6 text-muted-foreground peer-data-[state=checked]:text-primary" />
                        <span className="font-medium">长图分享</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setView("main")}>
                  返回
                </Button>
                <Button onClick={handleExport} disabled={isExporting} className="min-w-[100px]">
                  {isExporting ? "导出中..." : "确认导出"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空正文？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将清空编辑器中的正文内容。此操作可以被撤销，但建议您先保存或备份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-red-600 hover:bg-red-700">
              确认清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
