"use client";

import { Button } from "@/components/tailwind/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/tailwind/ui/dialog";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { useEffect, useState } from "react";

// 大纲类型
export type OutlineType = "总纲" | "分卷大纲" | "章节细纲";

// 大纲创建对话框
interface OutlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { content: string }) => void;
}

export function OutlineDialog({ open, onOpenChange, onConfirm }: OutlineDialogProps) {
  const [content, setContent] = useState("");

  const handleConfirm = () => {
    if (!content.trim()) return;

    onConfirm({
      content,
    });

    handleClose();
  };

  const handleClose = () => {
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加大纲</DialogTitle>
          <DialogDescription>请输入大纲内容</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入大纲内容..."
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!content.trim()}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 分卷大纲对话框
interface VolumeOutlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    volumeId: string;
    volumeTitle: string;
    content: string;
  }) => void;
  volumes: Array<{ id: string; title: string }>;
}

export function VolumeOutlineDialog({ open, onOpenChange, onConfirm, volumes = [] }: VolumeOutlineDialogProps) {
  const [volumeId, setVolumeId] = useState<string>("");
  const [content, setContent] = useState("");

  const handleConfirm = () => {
    if (!content.trim() || !volumeId) return;

    const selectedVolume = volumes.find((v) => v.id === volumeId);
    if (!selectedVolume) return;

    onConfirm({
      volumeId,
      volumeTitle: selectedVolume.title,
      content,
    });

    handleClose();
  };

  const handleClose = () => {
    setContent("");
    setVolumeId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加分卷大纲</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>选择分卷</Label>
            <Select value={volumeId} onValueChange={setVolumeId}>
              <SelectTrigger>
                <SelectValue placeholder="选择分卷" />
              </SelectTrigger>
              <SelectContent>
                {volumes.map((volume) => (
                  <SelectItem key={volume.id} value={volume.id}>
                    {volume.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>大纲内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
              placeholder="请输入分卷大纲内容..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!content.trim() || !volumeId}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 章节大纲对话框
interface ChapterOutlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    content: string;
    relatedChapter: { id: string; title: string; isExternal?: boolean };
  }) => void;
  availableChapters?: Array<{ id: string; title: string }>;
}

export function ChapterOutlineDialog({
  open,
  onOpenChange,
  onConfirm,
  availableChapters = [],
}: ChapterOutlineDialogProps) {
  const [content, setContent] = useState("");
  const [showChapterSelect, setShowChapterSelect] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState<{ id: string; title: string; isExternal?: boolean } | null>(
    null,
  );
  const [externalChapterTitle, setExternalChapterTitle] = useState("");
  const [isManualInput, setIsManualInput] = useState(false);

  const handleConfirm = () => {
    if (!content.trim() || !selectedChapter) return;

    onConfirm({
      content,
      relatedChapter: selectedChapter,
    });

    handleClose();
  };

  const handleClose = () => {
    setContent("");
    setShowChapterSelect(true);
    setSelectedChapter(null);
    setExternalChapterTitle("");
    setIsManualInput(false);
    onOpenChange(false);
  };

  const handleChapterSelect = (chapter: { id: string; title: string }) => {
    setSelectedChapter({
      id: chapter.id,
      title: chapter.title,
      isExternal: false,
    });
  };

  const handleExternalChapterSave = () => {
    if (externalChapterTitle.trim()) {
      setSelectedChapter({
        id: `external-${Date.now()}`,
        title: externalChapterTitle,
        isExternal: true,
      });
      setIsManualInput(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>添加章节大纲</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>关联章节</Label>
              {selectedChapter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedChapter(null);
                    setShowChapterSelect(true);
                    setIsManualInput(false);
                  }}
                  className="h-7 text-xs text-orange-500"
                >
                  重新选择
                </Button>
              )}
            </div>

            {selectedChapter ? (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">已选择：</span>
                <span className="text-sm font-medium truncate">{selectedChapter.title}</span>
              </div>
            ) : (
              <div className="border rounded-lg p-3 space-y-3">
                {availableChapters && availableChapters.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-500">选择已有章节：</div>
                    <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto">
                      {availableChapters.map((chapter) => (
                        <button
                          key={chapter.id}
                          onClick={() => handleChapterSelect(chapter)}
                          className="text-left px-3 py-2 text-sm hover:bg-gray-100 rounded truncate"
                        >
                          {chapter.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-500">
                    {isManualInput ? (
                      "输入外部章节："
                    ) : (
                      <button onClick={() => setIsManualInput(true)} className="text-blue-600 hover:text-blue-700">
                        手动输入章节 →
                      </button>
                    )}
                  </div>
                  {isManualInput && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={externalChapterTitle}
                        onChange={(e) => setExternalChapterTitle(e.target.value)}
                        className="flex-1"
                        placeholder="输入章节名称"
                      />
                      <Button onClick={handleExternalChapterSave} disabled={!externalChapterTitle.trim()}>
                        确定
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>大纲内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
              placeholder="请输入章节大纲内容..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!content.trim() || !selectedChapter}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 分卷选择对话框
export function VolumeSelectDialog({
  open,
  onOpenChange,
  onConfirm,
  volumes,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (volumeId: string) => void;
  volumes: Array<{ id: string; title: string }>;
}) {
  const [selectedVolumeId, setSelectedVolumeId] = useState("");

  const handleConfirm = () => {
    if (selectedVolumeId) {
      onConfirm(selectedVolumeId);
      setSelectedVolumeId("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>选择分卷</DialogTitle>
          <DialogDescription>请选择要关联的分卷</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>分卷列表</Label>
            <div className="space-y-2">
              {volumes.map((volume) => (
                <button
                  key={volume.id}
                  type="button"
                  onClick={() => setSelectedVolumeId(volume.id)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedVolumeId === volume.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {volume.title}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!selectedVolumeId}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 章节选择对话框
export function ChapterSelectDialog({
  open,
  onOpenChange,
  onConfirm,
  chapters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (chapterId: string) => void;
  chapters: Array<{ id: string; title: string }>;
}) {
  const [selectedChapterId, setSelectedChapterId] = useState("");

  const handleConfirm = () => {
    if (selectedChapterId) {
      onConfirm(selectedChapterId);
      setSelectedChapterId("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>选择章节</DialogTitle>
          <DialogDescription>请选择要关联的章节</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>章节列表</Label>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => setSelectedChapterId(chapter.id)}
                  className={`w-full text-left px-3 py-2 rounded ${
                    selectedChapterId === chapter.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  {chapter.title}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!selectedChapterId}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 内容编辑对话框
export function ContentEditDialog({
  open,
  onOpenChange,
  onConfirm,
  initialContent = "",
  title = "编辑内容",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (content: string) => void;
  initialContent?: string;
  title?: string;
}) {
  const [content, setContent] = useState(initialContent);

  const handleConfirm = () => {
    onConfirm(content);
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="content">内容</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入内容..."
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!content.trim()}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 大纲内容对话框属性
interface OutlineContentDialogProps {
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

// 大纲内容对话框
export function OutlineContentDialog({
  open,
  onClose,
  onConfirm,
  availableChapters = [],
  onChapterClick,
  initialContent = "",
  initialRelatedChapter,
}: OutlineContentDialogProps) {
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
          <DialogTitle>编辑大纲内容</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label className="mb-2 block">内容</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="详细描述该大纲内容..."
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
