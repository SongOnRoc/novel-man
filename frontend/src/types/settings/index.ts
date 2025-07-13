export interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  autoSave: boolean;
}

export interface AISettings {
  defaultWritingStyle: string;
}

export interface UserSettings {
  editor: EditorSettings;
  ai: AISettings;
}