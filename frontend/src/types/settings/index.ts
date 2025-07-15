export interface EditorSettings {
  fontSize: number;
  lineHeight: number;
  autoSave: boolean;
}

export interface AISettings {
  defaultWritingStyle: string;
  model?: string;
  apiKey?: string;
  apiEndpoint?: string;
}

export interface UserSettings {
  editor: EditorSettings;
  ai: AISettings;
}