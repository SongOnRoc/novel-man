'use client';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Send } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Draft } from '@/lib/services/draft.service';
import { Work } from '@/lib/services/work.service';
import { useRouter } from 'next/navigation';

interface DraftCardProps {
  draft: Draft;
  works: Work[];
  onDelete: () => void;
  onPublish: () => void;
}

export function DraftCard({
  draft,
  works,
  onDelete,
  onPublish,
}: DraftCardProps) {
  const router = useRouter();
  const work = works.find((w) => w.id === draft.work_id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{draft.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {draft.content}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <p className="text-sm font-medium">{work?.title}</p>
          <p className="text-xs text-muted-foreground">
            Updated at {new Date(draft.updated_at!).toLocaleString()}
          </p>
        </div>
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
            <DropdownMenuItem onClick={onPublish}>
              <Send className="mr-2 h-4 w-4" />
              Publish
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
