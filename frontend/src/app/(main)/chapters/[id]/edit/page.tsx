"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TiptapEditor } from "@/features/editor/components/TiptapEditor";
import {
  useChapterById,
  useUpdateChapter,
} from "@/hooks/chapter/useChapterService";
import {
  ChapterForClient,
  UpdateChapterPayloadForClient,
} from "@/lib/services/chapter.service";

const EditChapterPage = (): React.ReactElement => {
  const params = useParams();
  const router = useRouter();
  const [targetCount, setTargetCount] = useState(2000);

  const chapterId = parseInt(params.id as string, 10);
  const { data: chapterResponse, isLoading, error } = useChapterById(chapterId);
  const { mutate: updateChapter, isPending: isSaving } = useUpdateChapter();

  const chapter = chapterResponse as ChapterForClient;

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load chapter data: ${error.message}`);
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
    const payload: UpdateChapterPayloadForClient = {
      title: data.title,
      content: data.content,
      wordCount: data.wordCount,
    };
    updateChapter(
      { id: chapterId, data: payload },
      {
        onSuccess: () => {
          toast.success("Chapter saved successfully");
        },
        onError: (error) => {
          toast.error(`Failed to save chapter: ${error.message}`);
        },
      }
    );
  };

  const handleSaveClick = (): void => {
    if (!chapter) return;

    // This manual save button is a bit redundant with auto-save,
    // and we don't have a clean way to get the latest word count here.
    // The editor's internal onSave (triggered by toolbar button or auto-save)
    // is the primary mechanism.
    // A better solution would be to expose a `save` method via a ref from TiptapEditor.
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
            <span className="sr-only">返回</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Chapter</h1>
            <p className="text-muted-foreground">
              Edit chapter content, drafts are saved automatically.
            </p>
          </div>
        </div>
      </div>

      {chapter ? (
        <TiptapEditor
          initialContent={{
            title: chapter.title!,
            content: chapter.content!,
          }}
          onSave={handleSave}
          placeholder="Start writing your chapter..."
          autoFocus
          contentId={chapter.id!.toString()}
          workId={chapter.workId!.toString()}
          containerId={`editor-${chapter.id}`}
          targetCount={targetCount}
          onTargetCountChange={setTargetCount}
          isSaving={isSaving}
        />
      ) : (
        !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-2xl font-semibold">Chapter not found</h2>
            <p className="mb-4 mt-2 text-muted-foreground">
              Could not load chapter data, or the specified chapter does not
              exist.
            </p>
          </div>
        )
      )}

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href={`/works/${chapter?.workId}/chapters`}>
            Back to Chapter List
          </Link>
        </Button>
        <div className="space-x-2">
          <Button
            variant="outline"
            disabled={isSaving || !chapter}
            onClick={handleSaveClick}
          >
            {isSaving ? "Saving..." : "Save as Draft"}
          </Button>
          <Button disabled={isSaving || !chapter} onClick={handleSaveClick}>
            {isSaving ? "Publishing..." : "Publish Chapter"}
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

export default EditChapterPage;
