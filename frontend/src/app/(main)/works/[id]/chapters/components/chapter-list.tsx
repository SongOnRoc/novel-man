"use client";

import {
  useChapterList,
  useDeleteChapter,
} from "@/hooks/chapter/useChapterService";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chapter, ChapterListResponse } from "@/lib/services/chapter.service";

interface ChapterListProps {
  workId: number;
}

export const ChapterList = ({ workId }: ChapterListProps) => {
  const router = useRouter();
  const { data: chaptersResponse, isLoading } = useChapterList({
    work_id: workId,
  });
  const deleteChapterMutation = useDeleteChapter();

  const chapters = (chaptersResponse as ChapterListResponse)?.data || [];

  const handleDelete = (id: number) => {
    deleteChapterMutation.mutate({ id });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link href={`/chapters/new?workId=${workId}`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Chapter
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Word Count</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chapters.map((chapter: Chapter) => (
            <TableRow key={chapter.id}>
              <TableCell>{chapter.title}</TableCell>
              <TableCell>{chapter.status}</TableCell>
              <TableCell>{chapter.word_count}</TableCell>
              <TableCell>
                {new Date(chapter.updated_at!).toLocaleString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        router.push(`/chapters/${chapter.id}/edit`)
                      }
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(chapter.id!)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
