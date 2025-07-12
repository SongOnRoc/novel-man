"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Book, Layers, FileText } from "lucide-react";
import Link from "next/link";
import { Work } from "../../components/WorkCard";
import { Outline, VolumeOutline, ChapterOutline } from "@/types/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// 模拟从API获取作品数据的函数，使用更新后的数据结构
const getWorkById = async (id: string): Promise<Work | null> => {
  const works: Work[] = [
    {
      id: "1",
      title: "修仙从种田开始",
      description: "一个普通农民意外获得仙家传承...",
      chapterCount: 23,
      wordCount: 78500,
      updatedAt: "2023-09-20",
      outline: {
        main: "主角李青，一个现代农业大学毕业生，意外穿越到修仙世界，利用科学知识结合仙法进行种田，最终成为一代仙农的传奇故事。",
        volumes: [
          {
            volumeId: "v1",
            title: "第一卷：仙农初成",
            order: 1,
            outline:
              "本卷主要讲述主角初入仙界，如何利用知识和机遇，建立自己的灵田，并与当地宗门产生初步联系。",
            chapters: [
              {
                chapterId: "1-1",
                title: "第一章 意外得到仙家传承",
                outline: "主角获得《仙农传承》，开启修仙之路。",
                order: 1,
              },
              {
                chapterId: "1-2",
                title: "第二章 初试灵力",
                outline: "主角第一次使用灵力改良土壤，效果显著。",
                order: 2,
              },
              {
                chapterId: "1-3",
                title: "第三章 神秘的种子",
                outline: "种下神秘种子，引发天地异象。",
                order: 3,
              },
            ],
          },
          {
            volumeId: "v2",
            title: "第二卷：仙农再起",
            order: 2,
            outline:
              "本卷主要讲述主角初入仙界，如何利用知识和机遇，建立自己的灵田，并与当地宗门产生初步联系。",
            chapters: [
              {
                chapterId: "1-3",
                title: "第三章 神秘的种子",
                outline: "种下神秘种子，引发天地异象。",
                order: 3,
              },
            ],
          },
        ],
      },
    },
    // 其他作品...
  ];
  await new Promise((resolve) => setTimeout(resolve, 500));
  return works.find((work) => work.id === id) || null;
};

export default function OutlinePage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [work, setWork] = useState<Work | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (typeof id === "string") {
      const fetchWork = async () => {
        setIsLoading(true);
        const fetchedWork = await getWorkById(id);
        setWork(fetchedWork);
        setOutline(fetchedWork?.outline || null);
        setIsLoading(false);
      };
      fetchWork();
    }
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    console.log(`正在为作品 ${id} 保存大纲:`, outline);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    router.push(`/works`);
  };

  const handleOutlineChange = (
    type: "main" | "volume" | "chapter",
    value: string,
    volumeId?: string,
    chapterId?: string
  ) => {
    if (!outline) return;

    let newOutline = { ...outline };

    if (type === "main") {
      newOutline.main = value;
    } else if (type === "volume" && volumeId) {
      const volume = newOutline.volumes.find((v) => v.volumeId === volumeId);
      if (volume) {
        volume.outline = value;
      }
    } else if (type === "chapter" && volumeId && chapterId) {
      const volume = newOutline.volumes.find((v) => v.volumeId === volumeId);
      if (volume) {
        const chapter = volume.chapters.find((c) => c.chapterId === chapterId);
        if (chapter) {
          chapter.outline = value;
        }
      }
    }

    setOutline(newOutline);
  };

  if (isLoading) return <div>正在加载大纲...</div>;
  if (!work || !outline) return <div>未找到该作品或大纲。</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/works">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              大纲管理: {work.title}
            </h1>
            <p className="text-muted-foreground">
              规划您的故事结构，让创作思路更清晰。
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "保存中..." : "保存大纲"}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="main" className="w-full">
        <TabsList>
          <TabsTrigger value="main">
            <Book className="mr-2 h-4 w-4" />
            总纲
          </TabsTrigger>
          <TabsTrigger value="volumes">
            <Layers className="mr-2 h-4 w-4" />
            分卷大纲
          </TabsTrigger>
          <TabsTrigger value="chapters">
            <FileText className="mr-2 h-4 w-4" />
            章节细纲
          </TabsTrigger>
        </TabsList>

        {/* Main Outline */}
        <TabsContent value="main">
          <Card>
            <CardHeader>
              <CardTitle>作品总纲</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={outline.main}
                onChange={(e) => handleOutlineChange("main", e.target.value)}
                placeholder="输入您的作品总纲..."
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Volume Outlines */}
        <TabsContent value="volumes">
          <div className="space-y-4">
            {outline.volumes.map((vol) => (
              <Card key={vol.volumeId}>
                <CardHeader>
                  <CardTitle>{vol.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={vol.outline}
                    onChange={(e) =>
                      handleOutlineChange(
                        "volume",
                        e.target.value,
                        vol.volumeId
                      )
                    }
                    placeholder={`输入 ${vol.title} 的大纲...`}
                    className="min-h-[150px]"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Chapter Outlines */}
        <TabsContent value="chapters">
          <div className="space-y-4">
            {outline.volumes.map((vol) => (
              <Card key={vol.volumeId}>
                <CardHeader>
                  <CardTitle>{vol.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vol.chapters.map((chap) => (
                    <div key={chap.chapterId} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{chap.title}</h4>
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/chapters/${chap.chapterId}/edit`}>
                            去编辑
                          </Link>
                        </Button>
                      </div>
                      <Textarea
                        value={chap.outline}
                        onChange={(e) =>
                          handleOutlineChange(
                            "chapter",
                            e.target.value,
                            vol.volumeId,
                            chap.chapterId
                          )
                        }
                        placeholder={`输入 ${chap.title} 的细纲...`}
                        className="min-h-[100px]"
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
