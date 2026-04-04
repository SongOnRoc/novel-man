'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import {
  useCreateDraft,
  useUpdateDraft,
} from "@/hooks/draft/useDraftService";
import {
  CreateDraftPayload,
  DraftForClient,
} from "@/lib/services/draft.service";

const formSchema = z.object({
  // We can keep other fields here if needed, e.g., status
});

interface DraftFormProps {
  workId?: number;
  draft?: DraftForClient;
  onSuccessNavigateTo?: string;
}

const getDefaultNavigatePath = (workId?: number): string =>
  typeof workId === "number" && workId > 0 ? `/works/${workId}/drafts` : "/drafts";

export const DraftForm = ({ workId, draft, onSuccessNavigateTo }: DraftFormProps) => {
  const router = useRouter();
  const navigatePath = onSuccessNavigateTo ?? getDefaultNavigatePath(workId);
  const createDraftMutation = useCreateDraft();
  const updateDraftMutation = useUpdateDraft();

  // Separate state for editor content
  const [editorData, setEditorData] = React.useState({
    title: draft?.title || "",
    content: draft?.content || "",
    wordCount: draft?.wordCount || 0,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
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

    if (draft) {
      updateDraftMutation.mutate(
        { id: draft.id!, data: payload },
        {
          onSuccess: () => {
            toast.success("草稿保存成功");
            router.push(navigatePath);
          },
          onError: (error: any) => {
            toast.error(`草稿保存失败: ${error.message}`);
          },
        }
      );
    } else {
      createDraftMutation.mutate(
        { ...payload, workId: workId } as CreateDraftPayload,
        {
          onSuccess: () => {
            toast.success("草稿创建成功");
            router.push(navigatePath);
          },
          onError: (error: any) => {
            toast.error(`草稿创建失败: ${error.message}`);
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
        />
        <Button type="submit">
          {draft ? "Update Draft" : "Create Draft"}
        </Button>
      </form>
    </Form>
  );
};
