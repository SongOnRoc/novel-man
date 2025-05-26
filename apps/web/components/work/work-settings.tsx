"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Input } from "@/components/tailwind/ui/input";
import { Label } from "@/components/tailwind/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/tailwind/ui/select";
import { Textarea } from "@/components/tailwind/ui/textarea";
import { BookOpen, ChevronDown, Edit2, FileText, Globe, Layers, Plus, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BackgroundCardSystem } from "./background-card-system";
import { CharacterCardSystem } from "./character-card-system";
import { OutlineCardSystem } from "./outline-card-system";

// 数据类型定义 - 为后端对接预留
interface WorkBasicInfo {
  id?: string;
  title: string;
  author: string;
  introduction: string;
  category: string;
  tags: string[];
  status: string;
  isPublic: boolean;
}

interface Character {
  id: string;
  name: string;
  description: string;
  role: string; // 主角、配角、反派等
  isCollapsed: boolean;
}

interface BackgroundSetting {
  id: string;
  title: string;
  content: string;
  type: string; // 世界观、力量体系、历史背景、自定义背景等
  isCollapsed: boolean;
}

interface OutlineItem {
  id: string;
  title: string;
  content: string;
  type: "总纲" | "分卷大纲" | "章节细纲";
  volumeId?: string; // 分卷大纲和章节细纲关联的分卷ID
  chapterNumber?: number; // 章节细纲的章节号
  isCollapsed: boolean;
}

interface Volume {
  id: string;
  title: string;
  description: string;
  order: number;
}

type ManagementTab = "outline" | "characters" | "background" | "volumes" | "basic";

// 将卡片组件移到外部，避免每次渲染都重新创建
interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

const CollapsibleCard = ({ title, children, onEdit, onDelete, isCollapsed, onToggle }: CollapsibleCardProps) => (
  <div className="border rounded-lg overflow-hidden mb-4">
    <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <button onClick={onToggle} className="flex items-center gap-2 flex-1 text-left">
        <ChevronDown className={`h-4 w-4 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
        <span className="font-medium">{title}</span>
      </button>
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
    {!isCollapsed && <div className="p-4">{children}</div>}
  </div>
);

export function WorkSettings() {
  const [activeTab, setActiveTab] = useState<ManagementTab>("outline");
  const [isMobile, setIsMobile] = useState(false);

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 初始检查
    checkMobile();

    // 监听窗口大小变化
    window.addEventListener("resize", checkMobile);

    // 清理监听器
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 基本信息
  const [workInfo, setWorkInfo] = useState<WorkBasicInfo>({
    title: "永生网络",
    author: "门前快石子路",
    introduction: "",
    category: "征文作品",
    tags: ["玄幻", "修仙"],
    status: "连载中",
    isPublic: true,
  });

  // 角色设定 - 保留旧数据结构，但不再使用
  const [characters, setCharacters] = useState<Character[]>([
    {
      id: "char-1",
      name: "主角",
      description: "故事的主要角色，具有特殊能力...",
      role: "主角",
      isCollapsed: false,
    },
  ]);

  // 背景设定
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSetting[]>([
    {
      id: "bg-1",
      title: "修炼体系",
      content: "练气、筑基、金丹、元婴...",
      type: "力量体系",
      isCollapsed: false,
    },
  ]);

  // 大纲设定
  const [outlines, setOutlines] = useState<OutlineItem[]>([
    {
      id: "outline-1",
      title: "故事总纲",
      content: "整个故事的主要脉络...",
      type: "总纲",
      isCollapsed: false,
    },
  ]);

  // 分卷设置
  const [volumes, setVolumes] = useState<Volume[]>([
    {
      id: "vol-1",
      title: "第一卷：初见",
      description: "故事的开始...",
      order: 1,
    },
  ]);

  // 按使用频率重新排序的标签
  const tabs = useMemo(
    () => [
      { id: "outline" as ManagementTab, label: "作品大纲", icon: FileText },
      { id: "characters" as ManagementTab, label: "角色设定", icon: Users },
      { id: "background" as ManagementTab, label: "背景设定", icon: Globe },
      { id: "volumes" as ManagementTab, label: "分卷设置", icon: Layers },
      { id: "basic" as ManagementTab, label: "基本信息", icon: BookOpen },
    ],
    [],
  );

  // 使用useCallback优化更新函数，避免不必要的重新渲染
  const updateCharacter = useCallback((id: string, updates: Partial<Character>) => {
    setCharacters((prev) => prev.map((char) => (char.id === id ? { ...char, ...updates } : char)));
  }, []);

  const updateBackgroundSetting = useCallback((id: string, updates: Partial<BackgroundSetting>) => {
    setBackgroundSettings((prev) => prev.map((setting) => (setting.id === id ? { ...setting, ...updates } : setting)));
  }, []);

  const updateOutline = useCallback((id: string, updates: Partial<OutlineItem>) => {
    setOutlines((prev) => prev.map((outline) => (outline.id === id ? { ...outline, ...updates } : outline)));
  }, []);

  const updateVolume = useCallback((id: string, updates: Partial<Volume>) => {
    setVolumes((prev) => prev.map((volume) => (volume.id === id ? { ...volume, ...updates } : volume)));
  }, []);

  // 删除函数
  const deleteCharacter = useCallback((id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const deleteBackgroundSetting = useCallback((id: string) => {
    setBackgroundSettings((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const deleteOutline = useCallback((id: string) => {
    setOutlines((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const deleteVolume = useCallback((id: string) => {
    setVolumes((prev) => prev.filter((v) => v.id !== id));
  }, []);

  // 添加函数
  const addCharacter = useCallback(() => {
    const newCharacter: Character = {
      id: `char-${Date.now()}`,
      name: "新角色",
      description: "",
      role: "配角",
      isCollapsed: false,
    };
    setCharacters((prev) => [...prev, newCharacter]);
  }, []);

  const addBackgroundSetting = useCallback(() => {
    const newSetting: BackgroundSetting = {
      id: `bg-${Date.now()}`,
      title: "新背景设定",
      content: "",
      type: "世界观",
      isCollapsed: false,
    };
    setBackgroundSettings((prev) => [...prev, newSetting]);
  }, []);

  const addOutline = useCallback((type: "总纲" | "分卷大纲" | "章节细纲") => {
    const newOutline: OutlineItem = {
      id: `outline-${Date.now()}`,
      title: type === "总纲" ? "新总纲" : type === "分卷大纲" ? "新分卷大纲" : "新章节细纲",
      content: "",
      type,
      isCollapsed: false,
    };
    setOutlines((prev) => [...prev, newOutline]);
  }, []);

  const addVolume = useCallback(() => {
    const newVolume: Volume = {
      id: `vol-${Date.now()}`,
      title: `第${volumes.length + 1}卷`,
      description: "",
      order: volumes.length + 1,
    };
    setVolumes((prev) => [...prev, newVolume]);
  }, [volumes.length]);

  const handleSave = useCallback(() => {
    // TODO: 实现保存逻辑，预留API调用
    const saveData = {
      workInfo,
      characters,
      backgroundSettings,
      outlines,
      volumes,
    };
    console.log("Saving work management:", saveData);
  }, [workInfo, characters, backgroundSettings, outlines, volumes]);

  // 渲染大纲
  const renderOutline = useCallback(
    () => <OutlineCardSystem volumes={volumes} isMobile={isMobile} />,
    [volumes, isMobile],
  );

  // 使用新的角色卡片系统
  const renderCharacters = useCallback(() => <CharacterCardSystem />, []);

  // 渲染背景设定
  const renderBackgroundSettings = useCallback(() => <BackgroundCardSystem isMobile={isMobile} />, [isMobile]);

  // 渲染分卷设置
  const renderVolumes = useCallback(
    () => (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">分卷管理</h3>
          <Button size="sm" onClick={addVolume}>
            <Plus className="h-4 w-4 mr-1" />
            添加分卷
          </Button>
        </div>

        <div className="space-y-3">
          {volumes.map((volume) => (
            <div key={volume.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <Input
                  value={volume.title}
                  onChange={(e) => updateVolume(volume.id, { title: e.target.value })}
                  className="flex-1 mr-4 font-medium"
                  placeholder="请输入分卷标题"
                />
                <Button variant="outline" size="sm" onClick={() => deleteVolume(volume.id)}>
                  删除
                </Button>
              </div>
              <Textarea
                value={volume.description}
                onChange={(e) => updateVolume(volume.id, { description: e.target.value })}
                placeholder="分卷简介..."
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>
    ),
    [volumes, addVolume, updateVolume, deleteVolume],
  );

  const renderBasicInfo = useCallback(
    () => (
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">作品名称</Label>
          <Input
            id="title"
            value={workInfo.title}
            onChange={(e) => setWorkInfo((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="请输入作品名称"
          />
        </div>

        <div>
          <Label htmlFor="author">作者</Label>
          <Input
            id="author"
            value={workInfo.author}
            onChange={(e) => setWorkInfo((prev) => ({ ...prev, author: e.target.value }))}
            placeholder="请输入作者名称"
          />
        </div>

        <div>
          <Label htmlFor="introduction">作品简介</Label>
          <Textarea
            id="introduction"
            value={workInfo.introduction}
            onChange={(e) => setWorkInfo((prev) => ({ ...prev, introduction: e.target.value }))}
            placeholder="请输入作品简介"
            rows={6}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">作品分类</Label>
            <Select
              value={workInfo.category}
              onValueChange={(value) => setWorkInfo((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="征文作品">征文作品</SelectItem>
                <SelectItem value="玄幻">玄幻</SelectItem>
                <SelectItem value="都市">都市</SelectItem>
                <SelectItem value="科幻">科幻</SelectItem>
                <SelectItem value="历史">历史</SelectItem>
                <SelectItem value="军事">军事</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">发布状态</Label>
            <Select
              value={workInfo.status}
              onValueChange={(value) => setWorkInfo((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="连载中">连载中</SelectItem>
                <SelectItem value="已完结">已完结</SelectItem>
                <SelectItem value="暂停">暂停</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={workInfo.isPublic}
            onChange={(e) => setWorkInfo((prev) => ({ ...prev, isPublic: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isPublic">公开发布</Label>
        </div>
      </div>
    ),
    [workInfo],
  );

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case "outline":
        return renderOutline();
      case "characters":
        return renderCharacters();
      case "background":
        return renderBackgroundSettings();
      case "volumes":
        return renderVolumes();
      case "basic":
        return renderBasicInfo();
      default:
        return renderOutline();
    }
  }, [activeTab, renderOutline, renderCharacters, renderBackgroundSettings, renderVolumes, renderBasicInfo]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">{renderTabContent()}</div>

      {/* Actions */}
      <div className="flex justify-end space-x-2 mt-8 pt-6 border-t">
        <Button variant="outline">取消</Button>
        <Button onClick={handleSave}>保存设置</Button>
      </div>
    </div>
  );
}
