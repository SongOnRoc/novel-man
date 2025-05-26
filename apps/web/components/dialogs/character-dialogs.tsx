"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/tailwind/ui/dialog";
import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";

// 角色创建对话框
interface CharacterDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; role: string }) => void;
}

export function CharacterDialog({ open, onClose, onConfirm }: CharacterDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("配角");

  const handleConfirm = () => {
    if (!name.trim()) return;
    onConfirm({ name, role });
    setName("");
    onClose();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="character-description">
        <DialogHeader>
          <DialogTitle>创建角色</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">角色名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入角色名称"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">角色类型</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="选择角色类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="主角">主角</SelectItem>
                <SelectItem value="配角">配角</SelectItem>
                <SelectItem value="反派">反派</SelectItem>
                <SelectItem value="路人">路人</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p id="character-description" className="sr-only">请输入角色信息</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} onKeyDown={(e) => handleKeyDown(e, onClose)}>
            取消
          </Button>
          <Button onClick={handleConfirm} onKeyDown={(e) => handleKeyDown(e, handleConfirm)}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 角色属性创建对话框
interface AttributeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { type: string }) => void;
  attributeTypes?: Array<{ value: string; label: string }>;
}

// 预定义的属性类型
export const ATTRIBUTE_TYPES = [
  { value: "description", label: "角色描述" },
  { value: "ability", label: "角色能力" },
  { value: "experience", label: "角色经历" },
  { value: "relationship", label: "人际关系" },
  { value: "custom", label: "自定义" },
];

export function AttributeDialog({ open, onClose, onConfirm, attributeTypes = ATTRIBUTE_TYPES }: AttributeDialogProps) {
  const [type, setType] = useState("description");

  const handleConfirm = () => {
    onConfirm({ type });
    onClose();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="sm:max-w-[425px]" aria-describedby="attribute-description">
        <DialogHeader>
          <DialogTitle>创建属性</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="type">属性类型</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue placeholder="选择属性类型" />
              </SelectTrigger>
              <SelectContent>
                {attributeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p id="attribute-description" className="sr-only">请选择角色属性类型</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} onKeyDown={(e) => handleKeyDown(e, onClose)}>
            取消
          </Button>
          <Button onClick={handleConfirm} onKeyDown={(e) => handleKeyDown(e, handleConfirm)}>确认</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 内容创建对话框
interface ContentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { content: string; }) => void;
  defaultContent?: string;
}

export function ContentDialog({ open, onClose, onConfirm, defaultContent = "" }: ContentDialogProps) {
  const [content, setContent] = useState(defaultContent);

  // 当对话框打开或defaultContent变化时更新内容
  useEffect(() => {
    if (open) {
      console.log("ContentDialog opened with defaultContent:", defaultContent);
      setContent(defaultContent);
    }
  }, [open, defaultContent]);

  const handleConfirm = () => {
    console.log("ContentDialog handleConfirm called with content:", content);
    if (!content.trim()) return;
    onConfirm({ content });
    handleClose();
  };

  const handleClose = () => {
    console.log("ContentDialog handleClose called");
    setContent("");
    onClose();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      console.log("ContentDialog onOpenChange:", isOpen);
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="content-description">
        <DialogHeader>
          <DialogTitle>编辑内容</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入内容..."
              className="min-h-[100px]"
            />
            <p id="content-description" className="sr-only">请在此输入卡片内容</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} onKeyDown={(e) => handleKeyDown(e, handleClose)}>取消</Button>
          <Button onClick={handleConfirm} onKeyDown={(e) => handleKeyDown(e, handleConfirm)} disabled={!content.trim()}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 