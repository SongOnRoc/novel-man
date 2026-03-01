"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import React from "react";
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
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import {
  useCreateChapter,
  useUpdateChapter,
} from "@/hooks/chapter/useChapterService";
import { ChapterForClient } from "@/lib/services/chapter.service";

const formSchema = z.object({
  status: z.string().optional(),
});

interface ChapterFormProps {
  workId: number;
  chapter?: ChapterForClient;
}

export const ChapterForm = ({ workId, chapter }: ChapterFormProps) => {
  const router = useRouter();
  const createChapterMutation = useCreateChapter();
  const updateChapterMutation = useUpdateChapter();

  // Separate state for editor content
  const [editorData, setEditorData] = React.useState({
    title: chapter?.title || "",
    content: chapter?.content || "",
    wordCount: chapter?.wordCount || 0,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: chapter?.status || "draft",
    },
  });

  const handleContentUpdate = (data: {
    title: string;
    content: string;
    wordCount: number;
  }) => {
    setEditorData(data);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const payload = {
      ...values,
      title: editorData.title,
      content: editorData.content,
      wordCount: editorData.wordCount,
    };

    if (chapter) {
      updateChapterMutation.mutate(
        { id: chapter.id!, data: payload },
        {
          onSuccess: () => {
            router.push(`/works/${workId}/chapters`);
          },
        }
      );
    } else {
      createChapterMutation.mutate(
        { ...payload, workId: workId },
        {
          onSuccess: () => {
            router.push(`/works/${workId}/chapters`);
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <TiptapEditor
          initialContent={{
            title: editorData.title,
            content: editorData.content,
          }}
          onContentUpdate={handleContentUpdate}
          placeholder="Start writing your chapter..."
        />
        {/* You can add other form fields here if needed, e.g., for status */}
        <Button
          type="submit"
          disabled={
            createChapterMutation.isPending || updateChapterMutation.isPending
          }
        >
          {chapter ? "Update Chapter" : "Create Chapter"}
        </Button>
      </form>
    </Form>
  );
};
