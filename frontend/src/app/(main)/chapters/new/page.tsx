"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { useCreateChapter } from "@/hooks/chapter/useChapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chapterFormSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  outline: z.string().optional(),
  content: z.string().optional(),
  workId: z.string().min(1, "必须关联一个作品"),
  // volumeId is not part of the backend model yet, so we remove it for now.
  // volumeId: z.string().min(1, "必须关联一个分卷"),
});

type ChapterFormValues = z.infer<typeof chapterFormSchema>;

function NewChapterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workId = searchParams.get("workId");
  const createChapterMutation = useCreateChapter();

  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: {
      title: "",
      outline: "",
      content: "",
      workId: workId || "",
    },
  });

  async function onSubmit(data: ChapterFormValues) {
    try {
      // Convert workId to number before sending to the API
      const chapterData = {
        title: data.title,
        outline: data.outline || "",
        content: data.content || "",
        workId: parseInt(data.workId, 10),
        status: "draft" as const, // Use 'as const' to satisfy the literal type
        wordCount: 0,
        order: 0,
      };

      await createChapterMutation.mutateAsync(chapterData);

      alert("章节创建成功！");
      router.push(`/works/${data.workId}/outline`); // Redirect to the work's outline page
    } catch (error) {
      console.error("Failed to create chapter:", error);
      alert("章节创建失败。请检查控制台获取更多信息。");
    }
  }

  if (!workId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">错误：缺少 workId，无法创建章节。</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建新章节</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>章节标题</FormLabel>
                  <FormControl>
                    <Input placeholder="输入章节标题" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>章节大纲（可选）</FormLabel>
                  <FormControl>
                    <Textarea placeholder="输入章节大纲" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>初始内容（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入章节的初始内容"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "创建中..." : "创建章节"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function NewChapterPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <NewChapterForm />
    </Suspense>
  );
}
