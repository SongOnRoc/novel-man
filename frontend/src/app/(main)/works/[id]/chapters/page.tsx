"use client";

import { useParams } from "next/navigation";
import { ChapterList } from "./components/chapter-list";
import { useWorkById } from "@/hooks/work/useWorkService";
import { Work } from "@/lib/services/work.service";

const ChaptersPage = () => {
  const params = useParams();
  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const { data: workResponse, isLoading } = useWorkById(workId);

  if (isLoading || isNaN(workId)) {
    return <div>Loading...</div>;
  }

  const work = workResponse?.data as Work;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chapters for {work?.title}</h1>
      <ChapterList workId={workId} />
    </div>
  );
};

export default ChaptersPage;
