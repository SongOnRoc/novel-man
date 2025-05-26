"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Edit3, FileText, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export function WritingAssistant() {
  const router = useRouter();

  const features = [
    {
      icon: Edit3,
      title: "智能写作",
      description: "使用AI助手帮助您创作更生动的内容",
      action: () => router.push("/"),
    },
    {
      icon: FileText,
      title: "大纲管理",
      description: "规划故事结构，管理章节大纲",
      action: () => console.log("Outline management"),
    },
    {
      icon: Target,
      title: "写作目标",
      description: "设定每日写作目标，追踪写作进度",
      action: () => console.log("Writing goals"),
    },
    {
      icon: Sparkles,
      title: "创意灵感",
      description: "获取写作灵感和创意提示",
      action: () => console.log("Creative inspiration"),
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">写作助手</h2>
        <p className="text-muted-foreground">使用强大的AI工具提升您的写作体验</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={feature.action}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                  <Button variant="outline" size="sm">
                    {feature.title === "智能写作" ? "开始写作" : "了解更多"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">快速开始</h3>
        </div>
        <p className="text-blue-800 mb-4">点击"开始写作"进入智能编辑器，享受AI辅助的写作体验。</p>
        <Button onClick={() => router.push("/")} className="bg-blue-600 hover:bg-blue-700">
          立即开始写作
        </Button>
      </div>
    </div>
  );
}
