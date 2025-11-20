"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { useCreateDraft } from "@/hooks/draft/useDraftService";
import { CreateDraftPayloadForClient } from "@/lib/services/draft.service";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";

const NewDraftPage = (): React.ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setBreadcrumb } = useBreadcrumb();
  
  const workIdParam = searchParams.get("workId");
  const initialWorkId = workIdParam ? parseInt(workIdParam, 10) : undefined;

  const { mutateAsync: createDraft, isPending: isSaving } = useCreateDraft();

  // Set breadcrumb for new draft
  useEffect(() => {
    setBreadcrumb("drafts-new", "新建草稿");
  }, [setBreadcrumb]);

  const handleSave = async (data: {
    title: string;
    content: string;
    wordCount: number;
  }): Promise<void> => {
    // Don't create draft if it's empty and title is default/empty
    if (!data.title && (!data.content || data.content === "<p></p>")) {
      return;
    }

    const payload: CreateDraftPayloadForClient = {
      title: data.title || "无标题草稿",
      content: data.content,
      workId: initialWorkId,
    };
    
    try {
      const newDraft = await createDraft(payload);
      // We don't show toast here because the redirect might clear it or happen too fast.
      // Instead we pass a query param to the edit page to show the toast there.
      
      // Redirect to edit page to continue editing
      // The generated type PostDrafts201 has data as unknown, so we need to cast it
      // or assume the hook returns the transformed data if using the custom hook
      const draftId = (newDraft as any).id || (newDraft as any).data?.id;
      if (draftId) {
        router.replace(`/drafts/${draftId}/edit?created=true`);
      } else {
        throw new Error("Failed to get draft ID from response");
      }
    } catch (error: any) {
      toast.error(`创建草稿失败: ${error.message}`);
      throw error; // Re-throw to let TiptapEditor know it failed
    }
  };

  return (
    <div className="h-full overflow-hidden bg-background flex flex-col">
      <div className="flex-1 overflow-hidden relative">
        <TiptapEditor
          initialContent={{
            title: "",
            content: "",
          }}
          onSave={handleSave}
          placeholder="开始你的创作..."
          autoFocus
          contentId="new-draft"
          workId={initialWorkId?.toString()}
          containerId="editor-new-draft"
          targetCount={2000}
          onTargetCountChange={() => {}}
          isSaving={isSaving}
          onBack={() => router.back()}
          // Hide publish button for new drafts until saved
          onPublish={undefined} 
        />
      </div>
    </div>
  );
};

export default NewDraftPage;
