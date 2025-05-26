"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/tailwind/ui/dialog";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { useEffect, useState } from "react";

// 角色类型
export const ATTRIBUTE_TYPES = [
  { value: "description", label: "外貌描述" },
  { value: "personality", label: "性格特点" },
  { value: "background", label: "背景故事" },
  { value: "ability", label: "能力特长" },
  { value: "relationship", label: "人际关系" },
  { value: "custom", label: "自定义属性" },
];

// 角色对话框属性
interface CharacterDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { name: string; role: string }) => void;
}

// 角色对话框
export function CharacterDialog({ open, onClose, onConfirm }: CharacterDialogProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("主角");

  // 重置表单
  useEffect(() => {
    if (open) {
      setName("");
      setRole("主角");
    }
  }, [open]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onConfirm({ name, role });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加角色</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">角色名称</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入角色名称" />
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
                <SelectItem value="龙套">龙套</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={handleSubmit}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 属性对话框属性
interface AttributeDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { type: string }) => void;
  attributeTypes?: Array<{ value: string; label: string }>;
}

// 属性对话框
export function AttributeDialog({ open, onClose, onConfirm, attributeTypes = ATTRIBUTE_TYPES }: AttributeDialogProps) {
  const [type, setType] = useState(attributeTypes[0]?.value || "");

  // 重置表单
  useEffect(() => {
    if (open && attributeTypes.length > 0) {
      setType(attributeTypes[0].value);
    }
  }, [open, attributeTypes]);

  const handleSubmit = () => {
    onConfirm({ type });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加属性</DialogTitle>
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
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={handleSubmit}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 内容对话框属性
interface ContentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    content: string;
    relatedChapter?: { id: string; title: string; isExternal?: boolean };
  }) => void;
  availableChapters?: Array<{ id: string; title: string }>;
  onChapterClick?: (chapterId: string) => void;
  initialContent?: string;
  initialRelatedChapter?: { id: string; title: string; isExternal?: boolean };
}

// 内容对话框
export function ContentDialog({
  open,
  onClose,
  onConfirm,
  availableChapters = [],
  onChapterClick,
  initialContent = "",
  initialRelatedChapter,
}: ContentDialogProps) {
  const [content, setContent] = useState(initialContent);
  const [selectedChapter, setSelectedChapter] = useState<
    { id: string; title: string; isExternal?: boolean } | undefined
  >(initialRelatedChapter);

  // 当对话框打开时重置内容
  useEffect(() => {
    if (open) {
      setContent(initialContent);
      setSelectedChapter(initialRelatedChapter);
    }
  }, [open, initialContent, initialRelatedChapter]);

  const handleSubmit = () => {
    onConfirm({
      content,
      relatedChapter: selectedChapter,
    });
    onClose();
  };

  const handleChapterClick = (chapter: { id: string; title: string }) => {
    setSelectedChapter({ id: chapter.id, title: chapter.title });
    if (onChapterClick) {
      onChapterClick(chapter.id);
    }
  };

  const handleRemoveChapter = () => {
    setSelectedChapter(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑内容</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="mb-2 block">内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述内容..."
              rows={10}
              className="min-h-[200px]"
            />
          </div>

          {availableChapters.length > 0 && (
            <div>
              <Label className="mb-2 block">关联章节</Label>
              {selectedChapter ? (
                <div className="flex items-center justify-between p-2 bg-gray-100 rounded">
                  <span>{selectedChapter.title}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveChapter}>
                    移除关联
                  </Button>
                </div>
              ) : (
                <div className="max-h-[200px] overflow-y-auto border rounded p-2">
                  <div className="text-sm text-gray-500 mb-2">选择要关联的章节：</div>
                  <div className="space-y-1">
                    {availableChapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        type="button"
                        className="p-2 hover:bg-gray-100 cursor-pointer rounded w-full text-left"
                        onClick={() => handleChapterClick(chapter)}
                      >
                        {chapter.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button type="button" onClick={handleSubmit}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
