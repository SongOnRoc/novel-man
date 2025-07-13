"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Book, Layers, FileText } from "lucide-react";
import Link from "next/link";
import { Work } from "@/types/work";
import { Outline, VolumeWithChapters, Chapter } from "@/types/work";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockWorks } from "@/lib/mock/works-mock-data";
import { mockOutlines } from "@/lib/mock/outline-mock-data";

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
      setIsLoading(true);
      const currentWork = mockWorks.find((w) => w.id === id);
      if (currentWork) {
        setWork(currentWork);
        // 直接从 mockOutlines 中查找对应的大纲
        const currentOutline = mockOutlines.find((o) => o.workId === id);
        setOutline(currentOutline || null);
      }
      setIsLoading(false);
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

    let newOutline = JSON.parse(JSON.stringify(outline)); // Deep copy to avoid state mutation issues

    if (type === "main") {
      newOutline.main = value;
    } else if (type === "volume" && volumeId) {
      const volume = newOutline.volumes.find(
        (v: VolumeWithChapters) => v.id === volumeId
      );
      if (volume) {
        volume.outline = value;
      }
    } else if (type === "chapter" && volumeId && chapterId) {
      const volume = newOutline.volumes.find(
        (v: VolumeWithChapters) => v.id === volumeId
      );
      if (volume) {
        const chapter = volume.chapters.find(
          (c: Chapter) => c.id === chapterId
        );
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
              大纲管理: {work.name}
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
              <Card key={vol.id}>
                <CardHeader>
                  <CardTitle>{vol.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={vol.outline}
                    onChange={(e) =>
                      handleOutlineChange("volume", e.target.value, vol.id)
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
              <Card key={vol.id}>
                <CardHeader>
                  <CardTitle>{vol.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vol.chapters.map((chap) => (
                    <div key={chap.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{chap.title}</h4>
                        <Button variant="link" size="sm" asChild>
                          <Link href={`/chapters/${chap.id}/edit`}>去编辑</Link>
                        </Button>
                      </div>
                      <Textarea
                        value={chap.outline}
                        onChange={(e) =>
                          handleOutlineChange(
                            "chapter",
                            e.target.value,
                            vol.id,
                            chap.id
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
