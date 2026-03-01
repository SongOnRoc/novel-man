/**
 * @file Settings Service
 * This service is responsible for all user settings-related API calls.
 * It uses the auto-generated API client functions and provides them
 * to the application's hooks.
 * @author Alex Chen
 */

import type {
  SettingsSettingResponse,
  SettingsSettingRequest,
} from "@/lib/api/generated/api10.schemas";
import {
  getSettings,
  postSettings,
} from "@/lib/api/generated/settings/settings";

// =================================================================
// Type Definitions and Transformations
// =================================================================

/**
 * Client-side representation of user settings (camelCase).
 */
export interface UserSettings {
  aiModel: "gpt-4" | "claude-3" | "custom";
  customApiEndpoint?: string;
  editorTheme: "light" | "dark";
  fontSize: number;
  lineHeight: number;
}

/**
 * Transforms server data (snake_case) to client-side format (camelCase).
 * @param serverSettings - The settings object from the API.
 * @returns A client-side UserSettings object.
 */
const transformSettingsForClient = (
  serverSettings: SettingsSettingResponse
): UserSettings => {
  return {
    aiModel: (serverSettings.ai_model as UserSettings["aiModel"]) || "gpt-4",
    customApiEndpoint: serverSettings.custom_api_endpoint || "",
    editorTheme:
      (serverSettings.editor_theme as UserSettings["editorTheme"]) || "light",
    fontSize: serverSettings.font_size || 16,
    lineHeight: serverSettings.line_height || 1.5,
  };
};

/**
 * Transforms client-side data (camelCase) to server format (snake_case).
 * @param clientSettings - The settings object from the client.
 * @returns A server-side SettingsSettingRequest object.
 */
const transformSettingsForServer = (
  clientSettings: UserSettings
): SettingsSettingRequest => {
  return {
    ai_model: clientSettings.aiModel,
    custom_api_endpoint: clientSettings.customApiEndpoint,
    editor_theme: clientSettings.editorTheme,
    font_size: clientSettings.fontSize,
    line_height: clientSettings.lineHeight,
  };
};

// =================================================================
// Service Functions
// =================================================================

/**
 * Fetches the current user's settings and transforms them for client-side use.
 * @returns A promise that resolves with the client-formatted user settings.
 */
export const getSettingsService = async (): Promise<UserSettings> => {
  const response = await getSettings();
  return transformSettingsForClient(response.data as SettingsSettingResponse);
};

/**
 * Updates the user's settings after transforming them for the server.
 * @param data - The client-side settings to update.
 * @returns A promise that resolves when the settings are updated.
 */
export const updateSettingsService = async (
  data: UserSettings
): Promise<void> => {
  const payload = transformSettingsForServer(data);
  await postSettings(payload);
};
