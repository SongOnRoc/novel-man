"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Settings2 } from "lucide-react";
import {
  EditorSettings as EditorSettingsType,
  EditorTheme,
  defaultEditorSettings,
} from "@/types/editor";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface EditorSettingsProps {
  settings: EditorSettingsType;
  onSettingsChange: (settings: EditorSettingsType) => void;
}

export function EditorSettings({
  settings,
  onSettingsChange,
}: EditorSettingsProps) {
  const [localSettings, setLocalSettings] =
    useState<EditorSettingsType>(settings);

  // 应用设置
  const applySettings = () => {
    onSettingsChange(localSettings);
  };

  // 重置为默认设置
  const resetToDefaults = () => {
    setLocalSettings(defaultEditorSettings);
  };

  // 更新单个设置项
  const updateSetting = <K extends keyof EditorSettingsType>(
    key: K,
    value: EditorSettingsType[K],
  ) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          编辑器设置
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>编辑器设置</DrawerTitle>
            <DrawerDescription>自定义编辑器外观和行为</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-6">
            {/* 主题设置 */}
            <div className="space-y-2">
              <Label>编辑器主题</Label>
              <RadioGroup
                value={localSettings.theme}
                onValueChange={(value) =>
                  updateSetting("theme", value as EditorTheme)
                }
                className="flex flex-wrap gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="theme-default" />
                  <Label htmlFor="theme-default">默认</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sepia" id="theme-sepia" />
                  <Label htmlFor="theme-sepia">护眼</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="theme-dark" />
                  <Label htmlFor="theme-dark">暗色</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minimal" id="theme-minimal" />
                  <Label htmlFor="theme-minimal">简约</Label>
                </div>
              </RadioGroup>
            </div>

            {/* 字体大小设置 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>字体大小</Label>
                <span>{localSettings.fontSize}px</span>
              </div>
              <Slider
                value={[localSettings.fontSize]}
                min={12}
                max={24}
                step={1}
                onValueChange={(value) => updateSetting("fontSize", value[0])}
              />
            </div>

            {/* 行间距设置 */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>行间距</Label>
                <span>{localSettings.lineSpacing}</span>
              </div>
              <Slider
                value={[localSettings.lineSpacing * 10]}
                min={10}
                max={30}
                step={1}
                onValueChange={(value) =>
                  updateSetting("lineSpacing", value[0] / 10)
                }
              />
            </div>

            {/* 显示字数统计 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-word-count">显示字数统计</Label>
              <Switch
                id="show-word-count"
                checked={localSettings.showWordCount}
                onCheckedChange={(checked) =>
                  updateSetting("showWordCount", checked)
                }
              />
            </div>

            {/* 自动保存设置 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-autosave">启用自动保存</Label>
                <Switch
                  id="enable-autosave"
                  checked={localSettings.enableAutoSave}
                  onCheckedChange={(checked) =>
                    updateSetting("enableAutoSave", checked)
                  }
                />
              </div>

              {localSettings.enableAutoSave && (
                <div className="space-y-2 pl-6">
                  <div className="flex justify-between">
                    <Label>自动保存间隔</Label>
                    <span>{localSettings.autoSaveInterval}秒</span>
                  </div>
                  <Slider
                    value={[localSettings.autoSaveInterval]}
                    min={5}
                    max={300}
                    step={5}
                    onValueChange={(value) =>
                      updateSetting("autoSaveInterval", value[0])
                    }
                  />
                </div>
              )}
            </div>
          </div>

          <DrawerFooter className="flex-row justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              恢复默认
            </Button>
            <div className="space-x-2">
              <DrawerClose asChild>
                <Button variant="outline">取消</Button>
              </DrawerClose>
              <Button onClick={applySettings}>应用设置</Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
