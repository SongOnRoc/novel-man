import { Button } from "@/components/tailwind/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/tailwind/ui/dialog";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { useEffect, useState } from "react";

// 背景内容对话框属性
interface BackgroundContentDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { content: string }) => void;
  initialContent?: string;
}

// 背景内容对话框
export function BackgroundContentDialog({
  open,
  onClose,
  onConfirm,
  initialContent = "",
}: BackgroundContentDialogProps) {
  const [content, setContent] = useState(initialContent);

  // 当对话框打开时重置内容
  useEffect(() => {
    if (open) {
      setContent(initialContent);
    }
  }, [open, initialContent]);

  const handleSubmit = () => {
    onConfirm({ content });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑背景内容</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="详细描述该背景设定..."
            rows={10}
            className="min-h-[200px]"
          />
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
