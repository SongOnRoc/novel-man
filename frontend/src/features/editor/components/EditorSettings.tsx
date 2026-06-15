"use client";

import { 
  Settings2, 
  Type, 
  AlignJustify, 
  Palette, 
  Save, 
  Eye, 
  Check, 
  RotateCcw,
  Minus,
  Plus,
  ALargeSmall,
  MoveVertical,
  Heading,
  Indent,
  ArrowUpDown
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  EditorSettings as EditorSettingsType,
  EditorTheme,
  defaultEditorSettings,
} from "@/types/editor";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";

interface EditorSettingsProps {
  settings: EditorSettingsType;
  onSettingsChange: (settings: EditorSettingsType) => void;
  onApply?: () => void;
}

export function EditorSettings({
  settings,
  onSettingsChange,
  onApply,
}: EditorSettingsProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const resetToDefaults = () => {
    onSettingsChange(defaultEditorSettings);
  };

  const updateSetting = <K extends keyof EditorSettingsType>(
    key: K,
    value: EditorSettingsType[K],
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const themes = [
    { id: 'default', label: '默认', bg: 'bg-background', border: 'border-border' },
    { id: 'sepia', label: '护眼', bg: 'bg-[#f4f1ea]', border: 'border-[#e8e6e1]' },
    { id: 'green', label: '清新', bg: 'bg-[#e3edcd]', border: 'border-[#d0dcb8]' },
    { id: 'parchment', label: '羊皮纸', bg: 'bg-[#f5e6c8]', border: 'border-[#e6d5b5]' },
    { id: 'blue', label: '蓝调', bg: 'bg-[#dbe9f5]', border: 'border-[#c8d8e6]' },
    { id: 'dark', label: '暗色', bg: 'bg-[#1a1a1a]', border: 'border-[#333]' },
    { id: 'minimal', label: '简约', bg: 'bg-white', border: 'border-gray-100' },
    { id: 'custom', label: '自定义', bg: 'bg-gradient-to-br from-primary/20 to-secondary/20', border: 'border-primary/20' },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="编辑器设置" className="hover:bg-muted/80 transition-colors">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-0 gap-0 flex flex-col bg-background/95 backdrop-blur-sm",
          isDesktop ? "w-full sm:w-[540px]" : "h-[70vh] rounded-t-2xl border-t-0"
        )}
      >
      <SheetHeader className="px-6 py-4 border-b bg-muted/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">编辑器设置</SheetTitle>
              <SheetDescription className="text-xs mt-0.5">自定义您的写作环境</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* 外观设置 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Palette className="h-4 w-4" />
              <span>外观样式</span>
            </div>
            
            <div className="grid grid-cols-4 gap-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => updateSetting("theme", theme.id as EditorTheme)}
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div className={cn(
                    "h-10 w-10 rounded-full border shadow-sm transition-all duration-300 flex items-center justify-center relative overflow-hidden",
                    theme.bg,
                    theme.border,
                    settings.theme === theme.id 
                      ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md" 
                      : "hover:scale-105 hover:border-primary/50 hover:shadow-sm"
                  )}>
                    {settings.theme === theme.id && (
                      <Check className={cn("h-4 w-4", theme.id === 'dark' || theme.id === 'blue' ? "text-white" : "text-primary")} />
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    settings.theme === theme.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {theme.label}
                  </span>
                </div>
              ))}
            </div>

            {/* 自定义主题颜色设置 */}
            {settings.theme === 'custom' && (
              <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">编辑区颜色</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border shadow-sm overflow-hidden relative">
                      <input 
                        type="color" 
                        value={settings.customTheme?.mainColor || '#ffffff'}
                        onChange={(e) => updateSetting("customTheme", { ...settings.customTheme, mainColor: e.target.value } as any)}
                        className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{settings.customTheme?.mainColor || '#ffffff'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">背景颜色</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border shadow-sm overflow-hidden relative">
                      <input 
                        type="color" 
                        value={settings.customTheme?.backgroundColor || '#f3f4f6'}
                        onChange={(e) => updateSetting("customTheme", { ...settings.customTheme, backgroundColor: e.target.value } as any)}
                        className="absolute -top-2 -left-2 w-12 h-12 p-0 border-0 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{settings.customTheme?.backgroundColor || '#f3f4f6'}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* 排版设置 */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Type className="h-4 w-4" />
              <span>排版设置</span>
            </div>

            {/* 字体大小 */}
            <div className="bg-card border rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium flex items-center gap-2">
                  <ALargeSmall className="h-4 w-4 text-muted-foreground" />
                  字体大小
                </Label>
                <span className="text-sm font-mono bg-muted px-2 py-1 rounded text-muted-foreground min-w-[3rem] text-center">
                  {settings.fontSize}px
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">A</span>
                <Slider
                  value={[settings.fontSize]}
                  min={14}
                  max={32}
                  step={1}
                  onValueChange={(value) => updateSetting("fontSize", value[0])}
                  className="flex-1"
                />
                <span className="text-lg font-medium text-muted-foreground">A</span>
              </div>
            </div>

            {/* 行间距 */}
            <div className="bg-card border rounded-xl p-4 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MoveVertical className="h-4 w-4 text-muted-foreground" />
                  行间距
                </Label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground min-w-[3rem] text-center">
                  {settings.lineSpacing}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <AlignJustify className="h-4 w-4 text-muted-foreground scale-y-75" />
                <Slider
                  value={[settings.lineSpacing * 10]}
                  min={10}
                  max={30}
                  step={1}
                  onValueChange={(value) => updateSetting("lineSpacing", value[0] / 10)}
                  className="flex-1"
                />
                <AlignJustify className="h-4 w-4 text-muted-foreground scale-y-125" />
              </div>
            </div>

            {/* 段落间距 */}
            <div className="bg-card border rounded-xl p-4 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  段落间距
                </Label>
                <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground min-w-[3rem] text-center">
                  {settings.paragraphSpacing || 1.5}em
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Minus className="h-3 w-3 text-muted-foreground" />
                <Slider
                  value={[(settings.paragraphSpacing || 1.5) * 10]}
                  min={5}
                  max={30}
                  step={1}
                  onValueChange={(value) => updateSetting("paragraphSpacing", value[0] / 10)}
                  className="flex-1"
                />
                <Plus className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </section>

          <Separator />

          {/* 功能设置 */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <Eye className="h-4 w-4" />
              <span>功能开关</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-card border rounded-xl p-3 hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="custom-title-style" className="text-sm font-medium cursor-pointer">自定义标题样式</Label>
                  <p className="text-[10px] text-muted-foreground">开启自由标题；关闭显示为 '第 X 章' 格式</p>
                </div>
                <Switch
                  id="custom-title-style"
                  checked={settings.customTitleStyle}
                  onCheckedChange={(checked) => updateSetting("customTitleStyle", checked)}
                />
              </div>

              <div className="flex items-center justify-between bg-card border rounded-xl p-3 hover:bg-muted/30 transition-colors">
                <div className="space-y-0.5">
                  <Label htmlFor="paragraph-indent" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                    <Indent className="h-3 w-3" />
                    首行缩进
                  </Label>
                  <p className="text-[10px] text-muted-foreground">段落首行自动缩进2字符</p>
                </div>
                <Switch
                  id="paragraph-indent"
                  checked={settings.paragraphIndent ?? true}
                  onCheckedChange={(checked) => updateSetting("paragraphIndent", checked)}
                />
              </div>
            </div>
          </section>
        </div>

        <SheetFooter className="flex-none px-4 py-3 sm:px-6 sm:py-6 border-t bg-muted/10 flex-row">
          <div className="flex items-center justify-between w-full gap-3">
            <Button
              variant="ghost"
              onClick={resetToDefaults}
              className="gap-2 h-9 rounded-full text-muted-foreground hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)] sm:h-10"
            >
              <RotateCcw className="h-4 w-4" />
              恢复默认
            </Button>
            <Button
              onClick={onApply}
              className="gap-2 h-9 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90 sm:h-10 sm:px-8"
            >
              <Save className="h-4 w-4" />
              应用设置
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
