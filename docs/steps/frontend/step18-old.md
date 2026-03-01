## 已完成的部分总结
目前我们已经完成了：
1. 创建了基础Next.js项目，并选择了Turbopack作为开发服务器
2. 安装并初始化了shadcn/ui，设置了组件系统
3. 安装了next-themes库用于实现深色/浅色主题切换功能
4. 创建了ThemeProvider组件来封装next-themes库的功能
5. 修改了根布局，添加了字体支持和主题切换功能
6. 修改了全局CSS文件，设置了主题颜色和小说编辑器相关样式
7. 安装了必要的UI组件
8. 创建了侧边栏和主布局组件，并设置了路由组布局
9. 创建了首页，包括统计卡片、最近作品和快速操作组件
10. 创建了主题切换按钮
11. 创建了作品列表页面
12. 创建了新作品页面
13. 安装了表单处理和验证相关的依赖
14. 创建了章节管理页面
15. 创建了草稿箱页面
16. 集成了Tiptap编辑器并创建了编辑器组件
17. 创建了章节编辑页面

## 第18步：创建AI写作助手页面

在小说创作过程中，作家经常会遇到灵感枯竭、角色塑造困难或需要优化文本等问题。AI写作助手可以帮助作家获取灵感、生成内容和优化文本，提高写作效率。

**执行命令**：
```
mkdir -p src/app/(main)/tools/ai-assistant/components
touch src/app/(main)/tools/ai-assistant/page.tsx
touch src/app/(main)/tools/ai-assistant/components/AIPromptForm.tsx
touch src/app/(main)/tools/ai-assistant/components/AIResponse.tsx
```

**创建文件**：`src/app/(main)/tools/ai-assistant/components/AIPromptForm.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 定义提示类型选项
const promptTypes = [
  { value: "plot-idea", label: "情节构思" },
  { value: "character-design", label: "角色设计" },
  { value: "world-building", label: "世界观构建" },
  { value: "dialogue", label: "对话生成" },
  { value: "text-polish", label: "文本优化" },
];

// 定义AIPromptForm组件的属性类型
interface AIPromptFormProps {
  onSubmit: (promptType: string, prompt: string) => void;
  isLoading: boolean;
}

// AI提示表单组件
export function AIPromptForm({ onSubmit, isLoading }: AIPromptFormProps) {
  // 状态管理
  const [promptType, setPromptType] = useState<string>("plot-idea");
  const [prompt, setPrompt] = useState<string>("");

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(promptType, prompt);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 提示类型选择器 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择辅助类型</label>
            <Select
              value={promptType}
              onValueChange={setPromptType}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择提示类型" />
              </SelectTrigger>
              <SelectContent>
                {promptTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 提示输入框 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">输入您的需求</label>
            <Textarea
              placeholder="例如：我需要构思一个修仙小说的主角，他有特殊的天赋但同时有致命的缺陷..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              disabled={isLoading}
              className="resize-none"
            />
          </div>

          {/* 提交按钮 */}
          <Button type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading ? "生成中..." : "生成内容"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

**创建文件**：`src/app/(main)/tools/ai-assistant/components/AIResponse.tsx`

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Clipboard, Save, RefreshCw } from "lucide-react";

// 定义AIResponse组件的属性类型
interface AIResponseProps {
  response: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

// AI响应组件
export function AIResponse({ response, isLoading, onRegenerate }: AIResponseProps) {
  // 状态管理
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // 复制文本到剪贴板
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      // 3秒后重置复制状态
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };
  
  // 保存到草稿
  const saveToDraft = () => {
    // 模拟保存到草稿的功能
    // 实际应用中应该调用API保存到后端
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    
    // 这里只是模拟，实际实现需要与后端API交互
    console.log("保存到草稿:", response);
    
    // 显示成功消息（在实际应用中可以使用Toast通知）
    alert("已保存到草稿箱");
  };

  return (
    <Card className={isLoading ? "opacity-70" : ""}>
      <CardContent className="pt-6">
        {response ? (
          <div className="prose max-w-none dark:prose-invert">
            <Textarea
              value={response}
              readOnly
              rows={12}
              className="resize-none font-serif text-base leading-relaxed"
            />
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            {isLoading ? "AI正在生成内容..." : "生成的内容将显示在这里"}
          </div>
        )}
      </CardContent>
      
      {response && (
        <CardFooter className="flex justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={isLoading}
            >
              <Clipboard className="h-4 w-4 mr-2" />
              {copied ? "已复制" : "复制"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveToDraft}
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {saved ? "已保存" : "保存到草稿"}
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重新生成
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
```

**创建文件**：`src/app/(main)/tools/ai-assistant/page.tsx`

```tsx
"use client";

import { useState } from "react";
import { AIPromptForm } from "./components/AIPromptForm";
import { AIResponse } from "./components/AIResponse";

// 示例AI回复，实际应用中应通过API调用获取
const mockAIResponses = {
  "plot-idea": "在一个被诅咒的世界里，人们的寿命被限制在25岁。主角发现自己拥有延长他人寿命的能力，但每次使用这种能力，就会缩短自己的生命。他成立了一个秘密组织，帮助那些他认为值得活下去的人，同时寻找诅咒的起源和破解之法。随着故事发展，他发现诅咒并非自然形成，而是远古时期一位绝望的炼金术士为了永生而设下的陷阱...",
  "character-design": "角色名：林明远\n\n背景：出生于修真世家，但家族在他10岁时因卷入宗门争斗而灭门。他被一位隐居的老者收养，学习了独特的炼丹技术。\n\n特点：\n- 拥有极高的药材辨识能力，能通过嗅觉分辨上千种药材\n- 因童年创伤，性格内向，不轻易信任他人\n- 左手有一道从手腕到肘部的伤疤，是家族灭门时留下的\n- 修炼时偏好用水系法术，但真正的天赋在炼丹\n\n矛盾点：渴望报仇雪恨，但又惧怕卷入权力斗争；想要守护身边人，却因内心的恐惧而难以真正亲近他人。",
  "world-building": "修真界的核心资源是「灵气」，它通过世界各处的「灵脉」流动。千年前一场大灾变让灵气稀薄，修真界从繁荣走向衰落。\n\n世界分为三层：\n\n1. 凡尘界：灵气最为稀薄，普通人类居住的地方，科技发展到类似现代初期\n\n2. 灵山域：灵气浓度中等，各大宗门建立在此，弟子通过吸收灵气修炼\n\n3. 仙界遗址：传说中真正的仙人居住之地，灾变后与下界隔绝，只留下一些遗迹\n\n社会结构由各大宗门组成松散联盟，宗门之间既合作又竞争。还有一些散修联合组成的「自由联盟」，与宗门体系并存。\n\n世界特有现象：每隔60年，天空会出现「灵雨」，持续七天，这期间修炼效果翻倍；有传说称灾变前的世界有七色灵雨，现在只剩下三色。",
  "dialogue": "林逸：「师父说过，修真之路，不在争强好胜，而在明心见性。」\n\n沈月：「那是因为你师父已经站在了金字塔顶端，居高临下地说这种话当然轻松。你看看那些被宗门欺压的散修，他们哪有资格谈明心见性？」\n\n林逸眉头微皱：「那你的意思是？」\n\n沈月靠在古树上，嗤笑一声：「我的意思很简单——先有实力，再谈理想。没有足够的力量，连自保都做不到，还谈什么大道理？」\n\n林逸沉默片刻，望向远处的宗门大殿：「或许你说得对...但我怕的是，当我们获得足够的力量后，还记不记得最初的初心。」\n\n沈月神色忽然认真：「这就是我欣赏你的地方，林师兄。你总是记得提醒自己不要迷失。也许...我们可以互相提醒。」",
  "text-polish": "原文：他快速地跑向了大门，心里非常害怕，因为他知道如果被发现的话，后果会很严重。\n\n修改后：\n他的脚步如同秋风扫落叶，贴着墙根悄无声息地向大门掠去。冷汗顺着脊背流下，每一次呼吸都像是惊雷在耳边炸响。一旦被发现，等待他的绝不仅仅是责罚那么简单——宗门对盗取秘籍的叛徒，历来只有一个结局。"
};

// AI写作助手页面组件
export default function AIAssistantPage() {
  // 状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [currentPromptType, setCurrentPromptType] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");

  // 处理提交
  const handleSubmit = async (promptType: string, prompt: string) => {
    // 保存当前的提示类型和内容，用于重新生成
    setCurrentPromptType(promptType);
    setCurrentPrompt(prompt);
    
    // 设置加载状态
    setIsLoading(true);
    
    try {
      // 在实际应用中，这里应该是API调用
      // 这里使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 1500)); // 模拟网络延迟
      
      // 获取对应类型的模拟回复
      const mockResponse = mockAIResponses[promptType as keyof typeof mockAIResponses] || 
        "AI助手正在学习中，暂时无法针对这个主题提供帮助。";
      
      setResponse(mockResponse);
    } catch (error) {
      console.error("获取AI响应失败:", error);
      setResponse("生成内容时出错，请稍后再试。");
    } finally {
      setIsLoading(false);
    }
  };

  // 重新生成内容
  const handleRegenerate = () => {
    if (currentPromptType && currentPrompt) {
      handleSubmit(currentPromptType, currentPrompt);
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI写作助手</h1>
        <p className="text-muted-foreground">
          描述您的写作需求，AI将为您提供创意、角色设计、情节构思或文本优化建议。
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 左侧：提示输入表单 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">您的需求</h2>
          <AIPromptForm onSubmit={handleSubmit} isLoading={isLoading} />
        </div>
        
        {/* 右侧：AI响应 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">AI响应</h2>
          <AIResponse 
            response={response} 
            isLoading={isLoading} 
            onRegenerate={handleRegenerate} 
          />
        </div>
      </div>
      
      {/* 使用说明 */}
      <div className="bg-muted p-4 rounded-lg mt-8">
        <h3 className="font-medium mb-2">使用提示</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
          <li>选择特定的辅助类型可以获得更精准的回复</li>
          <li>详细描述您的需求，包括背景、风格和特定要求</li>
          <li>生成的内容仅供参考，请根据您的创作风格进行调整</li>
          <li>您可以将满意的内容保存到草稿箱，方便后续编辑</li>
        </ul>
      </div>
    </div>
  );
}
```

**执行目的**：
创建完整的AI写作助手页面，包括：
1. 提示表单组件，让用户选择辅助类型并输入需求
2. AI响应组件，展示生成内容并提供复制、保存和重新生成功能
3. 主页面组件，整合表单和响应，并提供使用指导

在MVP版本中，我们使用模拟数据代替真实API调用，通过预设的示例响应展示功能效果。这种方式可以：
1. 快速开发出可演示的产品，验证用户界面和交互逻辑
2. 避免在前端开发阶段依赖后端API的完成情况
3. 为后续集成真实API预留清晰的接口和结构

页面布局采用双栏设计，左侧用于输入，右侧显示结果，适合桌面端使用；在移动设备上自动转为单栏布局，确保良好的响应式体验。

**替代方案**：
1. **聊天界面**：采用对话形式与AI交互，更自然但占用更多屏幕空间
2. **向导式设计**：将用户输入分成多个步骤引导填写，更结构化但增加了操作复杂度
3. **模板库**：提供预设的写作需求模板供选择，减少用户输入但限制了自定义能力

您理解这个完整的AI写作助手页面的设计和实现了吗？
