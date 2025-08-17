"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Bookmark, Edit, Trash2, BookmarkPlus } from "lucide-react";
import { Bookmark as BookmarkType } from "@/types/editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Editor } from "@tiptap/react";

interface BookmarkManagerProps {
  editor: Editor | null;
  bookmarks: BookmarkType[];
  addBookmark: (label?: string) => void;
  removeBookmark: (id: string) => void;
  updateBookmarkLabel: (id: string, label: string) => void;
  jumpToBookmark: (id: string) => void;
}

export function BookmarkManager({
  editor,
  bookmarks,
  addBookmark,
  removeBookmark,
  updateBookmarkLabel,
  jumpToBookmark,
}: BookmarkManagerProps) {
  const [newBookmarkLabel, setNewBookmarkLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // 处理添加书签
  const handleAddBookmark = () => {
    if (!editor) return;

    const label = newBookmarkLabel.trim() || "未命名书签";
    addBookmark(label);
    setNewBookmarkLabel("");
  };

  // 开始编辑书签
  const startEditing = (bookmark: BookmarkType) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
  };

  // 保存书签编辑
  const saveEditing = () => {
    if (editingId && editLabel.trim()) {
      updateBookmarkLabel(editingId, editLabel.trim());
    }
    setEditingId(null);
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null);
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          书签管理
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>书签管理</DrawerTitle>
            <DrawerDescription>
              在章节中添加书签，方便快速导航和定位
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4">
            {/* 添加新书签 */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="输入书签名称"
                value={newBookmarkLabel}
                onChange={(e) => setNewBookmarkLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddBookmark();
                  }
                }}
              />
              <Button onClick={handleAddBookmark}>
                <BookmarkPlus className="h-4 w-4 mr-2" />
                添加
              </Button>
            </div>

            {/* 书签列表 */}
            <ScrollArea className="h-[300px] pr-4">
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无书签，请添加新书签
                </div>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      {editingId === bookmark.id ? (
                        <div className="flex-1 flex gap-2">
                          <Input
                            value={editLabel}
                            onChange={(e) => setEditLabel(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditing();
                              if (e.key === "Escape") cancelEditing();
                            }}
                          />
                          <Button size="sm" onClick={saveEditing}>
                            保存
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEditing}
                          >
                            取消
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            className="flex-1 justify-start font-normal"
                            onClick={() => jumpToBookmark(bookmark.id)}
                          >
                            <Bookmark className="h-4 w-4 mr-2" />
                            {bookmark.label}
                          </Button>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(bookmark)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeBookmark(bookmark.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
