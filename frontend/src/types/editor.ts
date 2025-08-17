export type EditorTheme = 'default' | 'sepia' | 'dark' | 'minimal';

export interface EditorContent {
  title: string;
  content: string;
}

export interface EditorSettings {
  theme: EditorTheme;
  fontSize: number;
  lineSpacing: number;
  showWordCount: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
}

export const defaultEditorSettings: EditorSettings = {
  theme: 'default',
  fontSize: 16,
  lineSpacing: 1.5,
  showWordCount: true,
  enableAutoSave: true,
  autoSaveInterval: 30,
};