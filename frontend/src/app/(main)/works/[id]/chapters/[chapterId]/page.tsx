import { redirect } from "next/navigation";

interface ChapterPageProps {
  params: Promise<{
    id: string;
    chapterId: string;
  }>;
}

export default async function ChapterPage({ params }: ChapterPageProps) {
  const resolvedParams = await params;
  // Redirect to the preview page as the default view for a chapter
  redirect(`/works/${resolvedParams.id}/chapters/${resolvedParams.chapterId}/preview`);
}