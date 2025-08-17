"use client";

import { useParams } from "next/navigation";
import { DraftList } from "./components/draft-list";
import { useWorkById } from "@/hooks/work/useWorkService";

const DraftsPage = () => {
  const params = useParams();
  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const { isLoading } = useWorkById(workId);

  if (isLoading || isNaN(workId)) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Drafts</h1>
      <DraftList workId={workId} />
    </div>
  );
};

export default DraftsPage;
