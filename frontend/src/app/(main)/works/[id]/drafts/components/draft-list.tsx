'use client';

import {
  useDraftList,
  useDeleteDraft,
  usePublishDraft,
} from '@/hooks/draft/useDraftService';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Draft, DraftListResponse } from '@/lib/services/draft.service';

interface DraftListProps {
  workId: number;
}

export const DraftList = ({ workId }: DraftListProps) => {
  const router = useRouter();
  const { data: draftsResponse, isLoading } = useDraftList({
    work_id: workId,
  });
  const deleteDraftMutation = useDeleteDraft();
  const publishDraftMutation = usePublishDraft();

  const drafts = (draftsResponse?.data as DraftListResponse)?.data || [];

  const handleDelete = (id: number) => {
    deleteDraftMutation.mutate({ id });
  };

  const handlePublish = (id: number) => {
    publishDraftMutation.mutate({ id });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button asChild>
          <Link href={`/drafts/new?workId=${workId}`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Draft
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Word Count</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drafts.map((draft: Draft) => (
            <TableRow key={draft.id}>
              <TableCell>{draft.title}</TableCell>
              <TableCell>{draft.word_count}</TableCell>
              <TableCell>
                {new Date(draft.updated_at!).toLocaleString()}
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
                      onClick={() => router.push(`/drafts/${draft.id}/edit`)}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handlePublish(draft.id!)}>
                      <Send className="mr-2 h-4 w-4" />
                      Publish
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(draft.id!)}>
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