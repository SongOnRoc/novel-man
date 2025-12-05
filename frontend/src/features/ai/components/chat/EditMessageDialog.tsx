import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";

interface EditMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newContent: string) => void;
  initialContent: string;
}

export function EditMessageDialog({
  isOpen,
  onClose,
  onSave,
  initialContent,
}: EditMessageDialogProps) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent, isOpen]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>编辑消息</AlertDialogTitle>
          <AlertDialogDescription>
            修改您的消息内容，然后点击保存。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="my-4 min-h-[120px]"
          autoFocus
        />
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>保存</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}