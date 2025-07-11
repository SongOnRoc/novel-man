// 编辑器内容类型
export interface EditorContent {
  title: string;
  content: string;
}

// 书签类型
export interface Bookmark {
  id: string;
  position: number; // 在文档中的位置（字符偏移量）
  label: string; // 书签标签
  createdAt: string; // 创建时间
}

// 编辑器主题类型
export type EditorTheme = "default" | "sepia" | "dark" | "minimal";

// 编辑器设置类型
export interface EditorSettings {
  theme: EditorTheme;
  fontSize: number;
  lineSpacing: number;
  showWordCount: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number; // 单位：秒
}

// 默认编辑器设置
export const defaultEditorSettings: EditorSettings = {
  theme: "default",
  fontSize: 16,
  lineSpacing: 1.5,
  showWordCount: true,
  enableAutoSave: true,
  autoSaveInterval: 30,
};
