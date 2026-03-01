"use client";

import { type FC, useState, useEffect, useCallback } from "react";
import { Loader2Icon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAvailableModelsService, type ModelsModel } from "@/lib/services/ai.service";
import { toast } from "sonner";

// =============================================================================
// Types
// =============================================================================

export interface AISettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AISettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

// =============================================================================
// Default Values
// =============================================================================

export const DEFAULT_AI_SETTINGS: AISettings = {
  apiKey: "",
  baseUrl: "",
  model: "",
  temperature: 0.7,
  maxTokens: 4096,
};

// =============================================================================
// Storage Utils
// =============================================================================

const STORAGE_KEY = "ai-assistant-settings";

export function loadAISettings(): AISettings {
  if (typeof window === "undefined") return DEFAULT_AI_SETTINGS;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_AI_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn("Failed to load AI settings:", e);
  }
  return DEFAULT_AI_SETTINGS;
}

export function saveAISettings(settings: AISettings): void {
  if (typeof window === "undefined") return;
  
  try {
    //不存储 API Key 到 localStorage（使用 HTTP-only Cookie）
    const toStore = { ...settings, apiKey: "" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (e) {
    console.warn("Failed to save AI settings:", e);
  }
}

// =============================================================================
// Component
// =============================================================================

export const AISettingsDialog: FC<AISettingsDialogProps> = ({
  open,
  onOpenChange,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = useState<AISettings>(settings);
  const [models, setModels] = useState<ModelsModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 同步外部 settings 到本地状态
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  // 获取模型列表
  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    try {
      const modelList = await getAvailableModelsService();
      setModels(modelList);
      
      // 如果当前没有选择模型且有可用模型，自动选择第一个
      if (!localSettings.model && modelList.length > 0) {
        setLocalSettings((prev) => ({
          ...prev,
          model: modelList[0].id || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      toast.error("获取模型列表失败");
    } finally {
      setIsLoadingModels(false);
    }
  }, [localSettings.model]);

  // 对话框打开时获取模型
  useEffect(() => {
    if (open) {
      fetchModels();
    }
  }, [open, fetchModels]);

  // 更新设置字段
  const updateSetting = useCallback(<K extends keyof AISettings>(
    key: K,
    value: AISettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 如果有 API Key 或Base URL，调用服务保存到 Cookie
      if (localSettings.apiKey || localSettings.baseUrl) {
        await getAvailableModelsService(
          localSettings.apiKey || undefined,
          localSettings.baseUrl || undefined
        );
      }
      
      // 保存到 localStorage（不含 API Key）
      saveAISettings(localSettings);
      
      // 通知父组件
      onSave(localSettings);
      onOpenChange(false);
      toast.success("设置已保存");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("保存设置失败，请检查 API Key 是否正确");
    } finally {
      setIsSaving(false);
    }
  };

  // Enter 键保存
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>AI 设置</DialogTitle>
          <DialogDescription>
            配置 AI 助手的模型、API 密钥和生成参数
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* 模型选择 */}
          <div className="grid gap-2">
            <Label htmlFor="model">模型</Label>
            <Select
              value={localSettings.model}
              onValueChange={(value) => updateSetting("model", value)}disabled={isLoadingModels}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder={isLoadingModels ? "加载中..." : "选择模型"} />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id || ""}>
                    {model.label || model.id}
                  </SelectItem>
                ))}{models.length === 0 && !isLoadingModels && (
                  <SelectItem value="" disabled>
                    无可用模型
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="w-fit"
              onClick={fetchModels}
              disabled={isLoadingModels}
            >
              {isLoadingModels && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              刷新模型列表
            </Button>
          </div>

          {/* API Key */}
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => updateSetting("apiKey", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="sk-..."
              autoComplete="off"
            /><p className="text-xs text-muted-foreground">
              API Key 通过安全 Cookie 存储，不会保存到本地存储中
            </p>
          </div>

          {/* Base URL */}
          <div className="grid gap-2">
            <Label htmlFor="baseUrl">Base URL（可选）</Label>
            <Input
              id="baseUrl"
              value={localSettings.baseUrl}
              onChange={(e) => updateSetting("baseUrl", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://api.openai.com/v1"
            />
            <p className="text-xs text-muted-foreground">
              使用自定义 API 端点时填写，留空使用默认配置
            </p>
          </div>

          {/* 温度 */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">温度</Label>
              <span className="text-sm text-muted-foreground">
                {localSettings.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[localSettings.temperature]}
              onValueChange={([value]) => updateSetting("temperature", value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              较低的值产生更确定的输出，较高的值更有创意
            </p>
          </div>

          {/* 最大 Token */}
          <div className="grid gap-2">
            <Label htmlFor="maxTokens">最大 Token 数</Label>
            <Input
              id="maxTokens"
              type="number"
              min={1}
              max={128000}
              value={localSettings.maxTokens}
              onChange={(e) => updateSetting("maxTokens", parseInt(e.target.value) || 4096)}
              onKeyDown={handleKeyDown}
            />
            <p className="text-xs text-muted-foreground">
              生成响应的最大长度限制
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// =============================================================================
// Hook for managing settings state
// =============================================================================

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 初始化时加载设置
  useEffect(() => {
    setSettings(loadAISettings());
  }, []);

  const handleSave = useCallback((newSettings: AISettings) => {
    setSettings(newSettings);
  }, []);

  const openDialog = useCallback(() => setIsDialogOpen(true), []);
  const closeDialog = useCallback(() => setIsDialogOpen(false), []);

  return {
    settings,
    isDialogOpen,
    setIsDialogOpen,
    openDialog,
    closeDialog,
    handleSave,
  };
}