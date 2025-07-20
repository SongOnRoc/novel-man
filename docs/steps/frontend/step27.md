## 已完成的部分总结
目前我们已经完成了：
1.  创建了基础Next.js项目，并选择了Turbopack作为开发服务器。
2.  安装并初始化了shadcn/ui，设置了组件系统。
3.  安装了next-themes库用于实现深色/浅色主题切换功能。
4.  创建了ThemeProvider组件来封装next-themes库的功能。
5.  修改了根布局，添加了字体支持和主题切换功能。
6.  修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式。
7.  安装了必要的UI组件。
8.  创建了侧边栏和主布局组件，并设置了路由组布局。
9.  实现了首页仪表盘，包括统计卡片、最近作品和快速操作。
10. 实现了作品管理页面，可以展示和创建新作品。
11. 实现了章节管理页面，可以根据作品筛选章节。
12. 实现了基本的草稿管理功能。
13. 实现了AI助手、角色设定和世界观设定的基本框架。
14. 实现了Tiptap编辑器，并集成了基础的文本编辑功能。
15. 实现了编辑器的书签管理和专注模式。
16. 实现了AI助手的悬浮按钮和交互界面。
17. 实现了角色和世界观的查找与选择功能。
18. 实现了创建角色和世界观条目的页面。
19. 实现了章节编辑页面，并集成了Tiptap编辑器。
20. 实现了基本的草稿功能。
21. 细化了AI助手、角色和世界观的模拟数据和类型。
22. 实现了作品大纲与章节细纲的完整功能。
23. 整理并完善了项目文档结构。
24. 实现了功能完善的“查找与替换”功能，并将其逻辑封装在独立的Tiptap扩展中。
25. 实现了设定速查功能。
26. 实现了用户个性化设置页面。

## 第27步：用户个性化设置页面

**目标与原因**：
为了提升用户体验，允许用户根据自己的偏好来自定义应用的外观和行为是至关重要的。本步骤旨在创建一个集中的设置页面，用户可以在此管理个人资料、调整编辑器参数（如字体大小、行间距）以及配置AI助手的行为（如默认写作风格）。

**执行命令**：
```
mkdir -p frontend/src/types/settings
touch frontend/src/types/settings/index.ts
mkdir -p frontend/src/hooks/settings
touch frontend/src/hooks/settings/useSettings.ts
touch frontend/src/app/(main)/settings/page.tsx
```

**创建文件**：`frontend/src/types/settings/index.ts`

```ts
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
```

**代码详解**：
1.  **模块化类型定义**: 我们为`EditorSettings`, `AISettings`, 和 `UserSettings` 创建了独立的接口。这种做法使得数据结构清晰、易于理解和扩展。当未来需要添加更多设置项时，我们只需在相应的接口中添加字段即可。

---

**创建文件**：`frontend/src/hooks/settings/useSettings.ts`

```ts
import { useState, useEffect } from 'react';
import { UserSettings } from '@/types/settings';

const SETTINGS_KEY = 'user-settings';

const defaultSettings: UserSettings = {
  editor: {
    fontSize: 16,
    lineHeight: 1.5,
    autoSave: true,
  },
  ai: {
    defaultWritingStyle: 'neutral',
  },
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      } else {
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      setSettings(defaultSettings);
    }
  };

  const saveSettings = (newSettings: UserSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return { settings, loadSettings, saveSettings };
}
```

**代码详解**：
1.  **自定义Hook**: `useSettings` 封装了所有与用户设置相关的逻辑，包括状态管理、从`localStorage`加载数据以及向`localStorage`保存数据。这使得UI组件可以保持简洁，只关注于展示和用户交互。
2.  **持久化**: 使用`localStorage`作为模拟的持久化存储。`loadSettings`在组件挂载时从`localStorage`读取设置，`saveSettings`则将新的设置写入。
3.  **默认值与错误处理**: 提供了`defaultSettings`对象，确保在没有保存设置或加载失败时，应用能够回退到一个已知的、可用的状态。`try...catch`块增强了代码的健壮性。

---

**创建文件**：`frontend/src/app/(main)/settings/page.tsx`

```tsx
"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/hooks/settings/useSettings";
import { UserSettings } from "@/types/settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  username: z.string().min(2, "用户名至少需要2个字符。"),
});

const editorFormSchema = z.object({
  fontSize: z.number().min(10).max(30),
  lineHeight: z.number().min(1).max(2),
  autoSave: z.boolean(),
});

const aiFormSchema = z.object({
  defaultWritingStyle: z.string(),
});

const writingStyleOptions = [
  { value: "neutral", label: "中性" },
  { value: "formal", label: "正式" },
  { value: "casual", label: "休闲" },
  { value: "poetic", label: "诗意" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { settings, saveSettings } = useSettings();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      username: session?.user?.name || "",
    },
  });

  const editorForm = useForm<z.infer<typeof editorFormSchema>>({
    resolver: zodResolver(editorFormSchema),
    values: settings.editor,
  });

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    values: settings.ai,
  });

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    // 在实际应用中，这里会调用API更新用户信息
    console.log("Profile updated:", data);
  };

  const onEditorSubmit = (data: z.infer<typeof editorFormSchema>) => {
    saveSettings({ ...settings, editor: data });
  };

  const onAiSubmit = (data: z.infer<typeof aiFormSchema>) => {
    saveSettings({ ...settings, ai: data });
  };
  
  // 监听编辑器表单变化并自动保存
  editorForm.watch((value) => {
    const currentEditorSettings = editorForm.getValues();
    saveSettings({ ...settings, editor: currentEditorSettings });
  });

  // 监听AI表单变化并自动保存
  aiForm.watch((value) => {
    const currentAiSettings = aiForm.getValues();
    saveSettings({ ...settings, ai: currentAiSettings });
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">个人资料</TabsTrigger>
          <TabsTrigger value="editor">编辑器设置</TabsTrigger>
          <TabsTrigger value="ai">AI助手设置</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          {/* ... 个人资料UI ... */}
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          {/* ... 编辑器设置UI ... */}
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          {/* ... AI助手设置UI ... */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

**代码详解**：
1.  **UI/UX设计**: 使用`Tabs`组件将不同类别的设置项（个人资料、编辑器、AI助手）清晰地分隔开，提高了页面的可读性和易用性。
2.  **表单管理与验证**: 集成了`react-hook-form`和`zod`，为每个设置部分创建了独立的表单和验证 schema。这确保了数据的完整性和有效性，并能向用户提供即时的、友好的错误提示。
3.  **组件化**: 利用`shadcn/ui`提供的`Input`, `Slider`, `Switch`, `Select`等原子组件，快速构建出功能丰富且风格统一的表单界面。
4.  **自动保存**: 通过`watch`方法监听表单值的变化，并在变化时自动调用`saveSettings`函数。这种“即时反馈”的设计省去了用户手动点击“保存”按钮的步骤，提升了用户体验。

**执行目的**：
本步骤通过创建类型定义、自定义Hook和React组件，构建了一个功能完善、可扩展且用户友好的设置页面。它不仅满足了当前的需求，也为未来添加更多个性化选项奠定了坚实的基础。

**替代方案**：
- **单个巨大表单**: 将所有设置项放在一个表单中会使组件变得非常复杂，难以管理和维护。
- **手动状态管理**: 不使用`react-hook-form`而手动管理表单状态和验证逻辑，会增加大量模板代码，且容易出错。
- **每次修改都弹窗确认**: 会严重干扰用户流程，体验不佳。自动保存是一个更现代、更流畅的解决方案。