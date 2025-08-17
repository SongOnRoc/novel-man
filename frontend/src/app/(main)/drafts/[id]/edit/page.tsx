"use client";

import { useState, useEffect } from "react";
import { useDraftById, useUpdateDraft } from "@/hooks/draft/useDraftService";
import { Draft, UpdateDraftPayload } from "@/lib/services/draft.service";
import { useParams, useRouter } from "next/navigation";

import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const EditDraftPage = () => {
  const params = useParams();
  const router = useRouter();
  const [targetCount, setTargetCount] = useState(2000);

  const draftId = parseInt(params.id as string, 10);
  const { data: draftResponse, isLoading, error } = useDraftById(draftId);
  const { mutate: updateDraft, isPending: isSaving } = useUpdateDraft();

  const draft = draftResponse as Draft;

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load draft data: ${error.message}`);
    }
  }, [error]);

  const handleBack = () => {
    router.back();
  };

  const handleSave = (data: { title: string; content: string }) => {
    const payload: UpdateDraftPayload = {
      title: data.title,
      content: data.content,
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

  const handleSaveClick = () => {
    if (!draft) return;

    const saveData = {
      title: draft.title || "",
      content: draft.content || "",
    };

    handleSave(saveData);
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
          workId={draft.work_id!.toString()}
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
          <Link href={`/works/${draft?.work_id}/drafts`}>
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
