"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Info, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { toCamelCase } from "@/lib/utils";

export interface ImportResult {
  success: number;
  failed: number;
  total: number;
  errors?: string[];
}

interface ImportDialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  allowedTypes?: string[];
  maxSize?: number; // in bytes
  onImport: (file: File) => Promise<any>; // Should return the raw API response
  onSuccess?: (result: ImportResult) => void;
  onError?: (error: any) => void;
  isUploading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_ALLOWED_TYPES = [".txt", ".md", ".json", ".zip"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const ImportDialog = ({
  trigger,
  title = "导入文件",
  description,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  maxSize = DEFAULT_MAX_SIZE,
  onImport,
  onSuccess,
  onError,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ImportDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>("");
  const [internalIsUploading, setInternalIsUploading] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return `不支持的文件类型。请上传 ${allowedTypes.join(", ")} 格式的文件`;
    }
    if (file.size > maxSize) {
      return `文件大小超过限制（最大 ${maxSize / 1024 / 1024}MB）`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setFileError(error);
        setFile(null);
      } else {
        setFileError("");
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setInternalIsUploading(true);
    try {
      const response = await onImport(file);
      // Handle both direct data or axios response structure
      const data = response.data || response;
      const result = toCamelCase(data) as ImportResult;
      
      if (result.success !== undefined) {
        if (result.success > 0) {
          toast.success(`成功导入 ${result.success} 个项目`);
          setOpen(false);
          setFile(null);
          onSuccess?.(result);
        } else if (result.failed > 0) {
           const errorMsg = Array.isArray(result.errors)
            ? result.errors.join(", ")
            : "未知错误";
          toast.error(`导入失败：${errorMsg}`);
          // Even if failed, we might want to notify parent
          onSuccess?.(result);
        } else {
             toast.warning("没有导入任何数据");
             onSuccess?.(result);
        }
      } else {
          // Fallback for unknown response structure
          toast.success("导入操作完成");
          setOpen(false);
          setFile(null);
          onSuccess?.({ success: 0, failed: 0, total: 0 } as ImportResult);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      const msg = error?.response?.data?.message || error?.message || "导入失败，请重试";
      toast.error(msg);
      onError?.(error);
    } finally {
      setInternalIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            {title}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-x-2">
            <DialogTitle>{title}</DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="w-64 bg-background/90 backdrop-blur-sm border-primary/20 shadow-lg rounded-xl">
                  <p className="text-sm font-medium text-primary">
                    支持的文件格式：
                  </p>
                  <ul className="list-disc pl-4 mt-2 text-xs text-muted-foreground space-y-1">
                    {allowedTypes.includes(".txt") && (
                      <li>
                        <span className="font-semibold text-foreground">.txt/.md:</span>{" "}
                        适用于单个文本内容。
                      </li>
                    )}
                    {allowedTypes.includes(".json") && (
                      <li>
                        <span className="font-semibold text-foreground">.json:</span>{" "}
                        适用于结构化数据批量导入。
                      </li>
                    )}
                    {allowedTypes.includes(".zip") && (
                      <li>
                        <span className="font-semibold text-foreground">.zip:</span>{" "}
                        适用于批量文件导入。
                      </li>
                    )}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <DialogDescription>
            {description || `支持 ${allowedTypes.join(", ")} 格式。`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="group relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
            <Upload
              className={`h-8 w-8 text-gray-400 group-hover:text-primary transition-colors ${
                file ? "hidden" : ""
              }`}
            />
            <p
              className={`mt-2 text-sm text-gray-500 group-hover:text-primary transition-colors ${
                file ? "hidden" : ""
              }`}
            >
              拖放文件或点击此处
            </p>
            {file && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-gray-700">{file.name}</p>
              </div>
            )}
            {fileError && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-5 w-5" />
                <p className="text-sm">{fileError}</p>
              </div>
            )}
            <Input
              id="file"
              type="file"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
              accept={allowedTypes.join(",")}
              disabled={internalIsUploading}
            />
          </div>
          {internalIsUploading && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                正在导入...
              </p>
            </div>
          )}
        </div>
        <Button
          onClick={handleUpload}
          disabled={!file || internalIsUploading || !!fileError}
          className="w-full"
        >
          {internalIsUploading ? "导入中..." : "上传并导入"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
