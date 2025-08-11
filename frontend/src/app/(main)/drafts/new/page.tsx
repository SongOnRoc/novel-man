"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateDraft } from "@/hooks/draft/useDrafts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewDraftPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createDraftMutation = useCreateDraft();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const workId = searchParams.get("work_id");
    await createDraftMutation.mutateAsync({
      title,
      content,
      workId: workId ? parseInt(workId) : 0,
      description: "",
      wordCount: content.length,
    });
    router.push("/drafts");
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>新建草稿</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                标题
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入草稿标题"
                required
              />
            </div>
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700"
              >
                内容
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="开始写作..."
                rows={15}
              />
            </div>
            <Button type="submit" disabled={createDraftMutation.isPending}>
              {createDraftMutation.isPending ? "保存中..." : "保存草稿"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
