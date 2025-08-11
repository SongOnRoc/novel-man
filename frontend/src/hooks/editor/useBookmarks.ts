import { useState, useCallback, useEffect } from "react";
import { Bookmark } from "@/types/editor";
import { Editor } from "@tiptap/react";

// 书签管理Hook
export function useBookmarks(editor: Editor | null, contentId: string) {
  // 书签列表
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // 从本地存储加载书签
  useEffect(() => {
    if (!contentId) return;

    try {
      const savedBookmarks = localStorage.getItem(`bookmarks-${contentId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error("加载书签失败:", error);
    }
  }, [contentId]);

  // 保存书签到本地存储
  const saveBookmarksToStorage = useCallback(
    (bookmarksList: Bookmark[]) => {
      if (!contentId) return;

      try {
        localStorage.setItem(
          `bookmarks-${contentId}`,
          JSON.stringify(bookmarksList),
        );
      } catch (error) {
        console.error("保存书签失败:", error);
      }
    },
    [contentId],
  );

  // 添加书签
  const addBookmark = useCallback(
    (label: string = "未命名书签") => {
      if (!editor) return;

      // 获取当前光标位置
      const { from } = editor.state.selection;

      // 创建新书签
      const newBookmark: Bookmark = {
        id: `bookmark-${Date.now()}`,
        position: from,
        label,
        createdAt: new Date().toISOString(),
      };

      // 更新书签列表
      const updatedBookmarks = [...bookmarks, newBookmark];
      setBookmarks(updatedBookmarks);
      saveBookmarksToStorage(updatedBookmarks);

      // 可以在这里添加一个可视化指示器，比如高亮当前位置
      editor.commands.setTextSelection(from);

      return newBookmark;
    },
    [editor, bookmarks, saveBookmarksToStorage],
  );

  // 删除书签
  const removeBookmark = useCallback(
    (bookmarkId: string) => {
      const updatedBookmarks = bookmarks.filter(
        (bookmark) => bookmark.id !== bookmarkId,
      );
      setBookmarks(updatedBookmarks);
      saveBookmarksToStorage(updatedBookmarks);
    },
    [bookmarks, saveBookmarksToStorage],
  );

  // 更新书签标签
  const updateBookmarkLabel = useCallback(
    (bookmarkId: string, newLabel: string) => {
      const updatedBookmarks = bookmarks.map((bookmark) =>
        bookmark.id === bookmarkId
          ? { ...bookmark, label: newLabel }
          : bookmark,
      );
      setBookmarks(updatedBookmarks);
      saveBookmarksToStorage(updatedBookmarks);
    },
    [bookmarks, saveBookmarksToStorage],
  );

  // 跳转到书签位置
  const jumpToBookmark = useCallback(
    (bookmarkId: string) => {
      if (!editor) return;

      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark) return;

      // 设置光标位置并滚动到视图
      editor.commands.setTextSelection(bookmark.position);

      // 使用DOM API滚动到选中位置
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.startContainer.parentElement?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 0);

      // 临时高亮当前位置
      const bookmarkClass = "bookmark-highlight";
      editor.commands.setMark("highlight");

      // 2秒后移除高亮
      setTimeout(() => {
        editor.commands.unsetMark("highlight");
      }, 2000);
    },
    [editor, bookmarks],
  );

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    updateBookmarkLabel,
    jumpToBookmark,
  };
}
