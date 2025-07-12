"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditorContent } from "@/types/editor";

// 修改模拟章节数据，添加workId字段
const mockChapters: Record<string, EditorContent & { workId: string }> = {
  "1-1": {
    title: "第一章 意外得到仙家传承",
    content:
      "<p>李青是一个普通的农村青年，从小就对种植有着浓厚的兴趣。他家祖祖辈辈都是种地的，但收成一直平平，生活也过得紧巴巴的。</p><p>这一天，李青像往常一样在自家的地里忙活。突然，他的锄头碰到了一个硬物。他以为是石头，便弯腰去捡，却发现那是一个古朴的小盒子。</p><p>好奇心驱使下，他打开了盒子，里面是一本泛黄的古书和一颗晶莹剔透的种子。古书上写着《仙农传承》四个大字。</p><p>当李青的手触碰到那本书的瞬间，一股奇异的能量涌入他的体内。他惊讶地发现，自己竟然能够感知到周围植物的生命力，甚至能够通过意念影响它们的生长。</p><p>这一刻，李青知道自己的人生将彻底改变。他决定按照古书上的指引，将那颗神秘的种子种下，开始了自己的修仙种田之路。</p>",
    workId: "work-1", // 添加作品ID
  },
  "1-2": {
    title: "第二章 初试灵力",
    content: `<p>回到家后，李青迫不及待地翻阅《仙农传承》。书中记载了许多奇特的种植方法和修炼功法，其中最基础的是"引灵入体"，可以吸收天地间的灵气，提升自身修为。</p><p>按照书上的指导，李青盘腿而坐，调整呼吸，尝试感知周围的灵气。起初，他什么也没感觉到，但坚持了大约一个小时后，他开始隐约感觉到有微弱的能量围绕着自己流动。</p><p>"这就是灵气吗？"李青心中暗想。他按照功法引导这些能量进入体内，顿时感到一股清凉之意流遍全身，疲劳一扫而空。</p><p>第二天清晨，李青来到自家的菜园，决定试试自己的新能力。他将手掌贴在一株长势不佳的白菜上，尝试将一丝灵力输入其中。</p><p>令他惊讶的是，那株白菜以肉眼可见的速度变得更加翠绿挺拔，叶片也更加厚实。这小小的成功让李青兴奋不已，他决定找一块隐蔽的地方，种下那颗神秘的种子。</p>`,
    workId: "work-1", // 添加作品ID
  },
};

// 章节编辑页面组件
export default function ChapterEditPage() {
  // 获取URL参数中的章节ID
  const params = useParams();
  // 获取路由器实例，用于页面导航
  const router = useRouter();
  // 从URL参数中提取章节ID
  const chapterId = params.id as string;

  // 编辑器内容状态
  const [editorContent, setEditorContent] = useState<EditorContent>({
    title: "",
    content: "",
  });

  // 添加workId状态
  const [workId, setWorkId] = useState<string>("");

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);

  // 加载章节数据
  useEffect(() => {
    // 模拟API请求延迟
    const loadChapter = async () => {
      setIsLoading(true);
      try {
        // 这里将来会调用API获取章节数据
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 从模拟数据中获取章节
        const chapter = mockChapters[chapterId];
        if (chapter) {
          setEditorContent({
            title: chapter.title,
            content: chapter.content,
          });
          // 设置workId
          setWorkId(chapter.workId);
        } else {
          console.error(`找不到章节: ${chapterId}`);
          // 如果找不到章节，可以重定向到章节列表
          // router.push('/chapters');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [chapterId, router]);

  // 保存章节
  const handleSave = async (content: EditorContent) => {
    // 这里将来会调用API保存章节
    console.log("保存章节:", chapterId, content);

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 更新本地数据
    if (mockChapters[chapterId]) {
      mockChapters[chapterId] = {
        ...content,
        workId: mockChapters[chapterId].workId,
      };
    }
  };

  // 返回上一页
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">返回</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">编辑章节</h1>
            <p className="text-muted-foreground">
              编辑章节内容，自动保存草稿。
            </p>
          </div>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              正在加载章节内容...
            </p>
          </div>
        </div>
      ) : (
        /* Tiptap编辑器 - 更新为使用新的编辑器功能 */
        <TiptapEditor
          initialContent={editorContent}
          onSave={handleSave}
          placeholder="开始编写您的章节内容..."
          autoFocus
          chapterId={chapterId}
          workId={workId}
          containerId={`editor-${chapterId}`} // 使用唯一的容器ID
        />
      )}

      {/* 底部操作按钮 */}
      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/chapters">返回章节列表</Link>
        </Button>
        <div className="space-x-2">
          <Button variant="outline">保存为草稿</Button>
          <Button>发布章节</Button>
        </div>
      </div>

      {/* 添加键盘快捷键提示 */}
      <div className="text-xs text-muted-foreground">
        <p>
          提示：按下 Ctrl+G
          可以跳转到指定行；使用书签管理器可以在重要位置添加书签。
        </p>
      </div>
    </div>
  );
}
