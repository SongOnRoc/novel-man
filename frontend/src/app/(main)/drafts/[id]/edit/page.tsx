"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getDraftById } from "@/lib/api/drafts";
import { useUpdateDraft } from "@/hooks/draft/useDrafts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditDraftPage() {
  const router = useRouter();
  const params = useParams();
  const draftId = parseInt(params.id as string);

  const { data: draft, isLoading } = useQuery({
    queryKey: ["drafts", "detail", draftId],
    queryFn: () => getDraftById(draftId),
    enabled: !!draftId,
  });

  const updateDraftMutation = useUpdateDraft();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (draft) {
      setTitle(draft.title);
      setContent(draft.content);
    }
  }, [draft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateDraftMutation.mutateAsync({
      id: draftId,
      data: { title, content },
    });
    router.push("/drafts");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>编辑草稿</CardTitle>
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
            <Button type="submit" disabled={updateDraftMutation.isPending}>
              {updateDraftMutation.isPending ? "保存中..." : "保存更改"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
