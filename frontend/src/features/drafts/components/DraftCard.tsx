"use client";

import { MoreHorizontal, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DraftForClient } from "@/lib/services/draft.service";
import { Work } from "@/lib/services/work.service";

interface DraftCardProps {
  draft: DraftForClient;
  workTitle?: string;
  onDelete: () => void;
  onPublish: () => void;
}

export function DraftCard({
  draft,
  workTitle,
  onDelete,
  onPublish,
}: DraftCardProps) {
  const router = useRouter();

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
          <p className="text-sm font-medium">{workTitle || "Untitled Work"}</p>
          <p className="text-xs text-muted-foreground">
            Updated at {formatDate(draft.updatedAt || draft.createdAt)}
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
