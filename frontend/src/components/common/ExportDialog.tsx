"use client";

import { Download } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExportDialogProps {
  onExport: (options: ExportOptions) => void;
  disabled?: boolean;
  /** 自定义触发器；不传则使用默认 outline 按钮 */
  trigger?: ReactNode;
}

export interface ExportOptions {
  format: "txt" | "png";
  range: "current" | "volume" | "all" | "custom";
}

export function ExportDialog({ onExport, disabled, trigger }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<"txt" | "png">("txt");
  const [range, setRange] = useState<"current" | "volume" | "all" | "custom">(
    "current",
  );

  const handleExportClick = () => {
    onExport({ format, range });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" disabled={disabled}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导出选项</DialogTitle>
          <DialogDescription>
            选择导出格式和范围，然后点击“开始导出”。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              格式
            </Label>
            <Select
              value={format}
              onValueChange={(value) => setFormat(value as "txt" | "png")}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="选择格式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="txt">TXT (文本文件)</SelectItem>
                <SelectItem value="png">PNG (图片)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">范围</Label>
            <RadioGroup
              value={range}
              onValueChange={(value) =>
                setRange(value as "current" | "volume" | "all" | "custom")
              }
              className="col-span-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="current" id="r1" />
                <Label htmlFor="r1">当前章节</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="volume" id="r2" />
                <Label htmlFor="r2">当前分卷</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="r3" />
                <Label htmlFor="r3">整部作品</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="r4" disabled />
                <Label htmlFor="r4">自定义范围 (暂不可用)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleExportClick}>
            开始导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
