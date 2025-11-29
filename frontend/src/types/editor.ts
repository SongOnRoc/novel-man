export type EditorTheme = 'default' | 'sepia' | 'dark' | 'minimal' | 'green' | 'parchment' | 'blue' | 'custom';

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
  customTitleStyle: boolean;
  customTheme?: {
    mainColor: string;
    backgroundColor: string;
  };
  paragraphSpacing: number;
  paragraphIndent: boolean;
}

export const defaultEditorSettings: EditorSettings = {
  theme: 'default',
  fontSize: 18,
  lineSpacing: 1.8,
  showWordCount: true,
  enableAutoSave: true,
  autoSaveInterval: 30,
  customTitleStyle: true,
  paragraphSpacing: 1.0,
  paragraphIndent: true,
};

export interface Bookmark {
  id: string;
  position: number;
  label: string;
  createdAt: string;
}