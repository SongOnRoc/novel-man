import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

// 创建自定义书签扩展
export const BookmarkExtension = Extension.create({
  name: "bookmark",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("bookmark"),
        props: {
          // 在这里我们可以添加自定义的DOM处理器
          decorations: (state) => {
            // 这里可以添加书签的可视化表示
            // 但实际的书签管理将在外部进行
            return null;
          },
        },
      }),
    ];
  },
});
