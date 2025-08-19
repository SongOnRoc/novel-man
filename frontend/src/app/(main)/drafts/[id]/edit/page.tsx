"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { useDraftById, useUpdateDraft } from "@/hooks/draft/useDraftService";
import { DraftForClient, UpdateDraftPayload } from "@/lib/services/draft.service";

const EditDraftPage = (): React.ReactElement => {
  const params = useParams();
  const router = useRouter();
  const [targetCount, setTargetCount] = useState(2000);

  const draftId = parseInt(params.id as string, 10);
  const { data: draftResponse, isLoading, error } = useDraftById(draftId);
  const { mutate: updateDraft, isPending: isSaving } = useUpdateDraft();

  const draft = draftResponse as DraftForClient;

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load draft data: ${error.message}`);
    }
  }, [error]);

  const handleBack = (): void => {
    router.back();
  };

  const handleSave = (data: {
    title: string;
    content: string;
    wordCount: number;
  }): void => {
    const payload: UpdateDraftPayload = {
      title: data.title,
      content: data.content,
      word_count: data.wordCount,
    };
    updateDraft(
      { id: draftId, data: payload },
      {
        onSuccess: () => {
          toast.success("Draft saved successfully");
        },
        onError: (error: Error) => {
          toast.error(`Failed to save draft: ${error.message}`);
        },
      }
    );
  };

  const handleSaveClick = (): void => {
    if (!draft) return;

    toast.info("Please use the save button in the editor toolbar.");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Skeleton className="w-full h-[60vh]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Draft</h1>
            <p className="text-muted-foreground">
              Edit draft content, drafts are saved automatically.
            </p>
          </div>
        </div>
      </div>

      {draft ? (
        <TiptapEditor
          initialContent={{
            title: draft.title!,
            content: draft.content!,
          }}
          onSave={handleSave}
          placeholder="Start writing your draft..."
          autoFocus
          contentId={draft.id!.toString()}
          workId={draft.workId!.toString()}
          containerId={`editor-${draft.id}`}
          targetCount={targetCount}
          onTargetCountChange={setTargetCount}
          isSaving={isSaving}
        />
      ) : (
        !isLoading &&
        (() => {
          toast.error("Draft not found");
          return null;
        })()
      )}

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/works/${draft?.workId}/drafts`}>
            Back to Draft List
          </Link>
        </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={isSaving || !draft}
            onClick={handleSaveClick}
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        <p>
          Tip: Press Ctrl+G to jump to a specific line; use the bookmark manager
          to add bookmarks at important locations.
        </p>
      </div>
    </div>
  );
};

export default EditDraftPage;
