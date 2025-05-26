"use client";

import { Button } from "@/components/tailwind/ui/button";
import { Edit3, FileText, Lightbulb, Target } from "lucide-react";
import { useRouter } from "next/navigation";

export function WritingManagement() {
  const router = useRouter();

  const handleDraftManagement = () => {
    router.push("/drafts");
  };

  const handleInspirationRecord = () => {
    // 创建一个新的灵感记录，跳转到编辑页面
    const inspirationTitle = `灵感记录 ${new Date().toLocaleDateString()}`;
    localStorage.setItem("novel-title", inspirationTitle);
    localStorage.setItem("novel-content", "");
    localStorage.setItem("novel-text-length", "0");
    localStorage.setItem("is-inspiration", "true");
    router.push("/");
  };

  const handleWritingGoals = () => {
    // TODO: 实现写作目标功能
    console.log("Writing goals");
  };

  const handleStartWriting = () => {
    router.push("/");
  };

  const features = [
    {
      icon: FileText,
      title: "草稿管理",
      description: "查看和管理您的所有草稿内容",
      action: handleDraftManagement,
      color: "bg-blue-100 text-blue-600",
    },
    {
      icon: Lightbulb,
      title: "灵感记录",
      description: "快速记录创作灵感和想法",
      action: handleInspirationRecord,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      icon: Target,
      title: "写作目标",
      description: "设定每日写作目标，追踪写作进度",
      action: handleWritingGoals,
      color: "bg-green-100 text-green-600",
    },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full">
            <Edit3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-2">写作管理</h2>
        <p className="text-muted-foreground">管理您的写作内容，记录灵感，追踪进度</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="p-6 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
              onClick={feature.action}
            >
              <div className="text-center">
                <div className={`inline-flex p-3 rounded-lg ${feature.color} mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{feature.description}</p>
                <Button variant="outline" size="sm" className="w-full">
                  {feature.title === "草稿管理" ? "打开草稿箱" : feature.title === "灵感记录" ? "新建灵感" : "查看详情"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 立即开始写作 */}
      <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Edit3 className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-purple-900 mb-2">准备好开始写作了吗？</h3>
          <p className="text-purple-800 mb-6">进入编辑器，开始您的创作之旅</p>
          <Button
            onClick={handleStartWriting}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
          >
            立即开始写作
          </Button>
        </div>
      </div>

      {/* 快速统计 */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">21</div>
          <div className="text-sm text-gray-500">已发布章节</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">4</div>
          <div className="text-sm text-gray-500">草稿数量</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">52,376</div>
          <div className="text-sm text-gray-500">总字数</div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">7</div>
          <div className="text-sm text-gray-500">连续写作天数</div>
        </div>
      </div>
    </div>
  );
}
