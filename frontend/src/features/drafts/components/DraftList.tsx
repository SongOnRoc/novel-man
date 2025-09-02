import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DraftForClient } from "@/lib/services/draft.service";
import { formatDate } from "@/lib/utils";

interface DraftListProps {
  drafts: DraftForClient[];
  onDelete: (draft: DraftForClient) => void;
  onPublish: (draft: DraftForClient) => void;
}

export function DraftList({ drafts, onDelete, onPublish }: DraftListProps) {
  return (
    <Card>
      <div className="space-y-2 p-4">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
          <div className="col-span-6">标题</div>
          <div className="col-span-2">字数</div>
          <div className="col-span-3">最后更新</div>
          <div className="col-span-1 text-right">操作</div>
        </div>
        {/* Body */}
        {drafts.map((draft) => (
          <div
            key={draft.id}
            className="grid grid-cols-12 items-center gap-4 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-accent/50"
          >
            <div className="col-span-6 font-medium">
              <Link
                href={`/drafts/${draft.id}/edit`}
                className="hover:underline"
              >
                {draft.title}
              </Link>
            </div>
            <div className="col-span-2">{draft.wordCount}</div>
            <div className="col-span-3">
              {formatDate(draft.updatedAt || draft.createdAt)}
            </div>
            <div className="col-span-1 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/drafts/${draft.id}/edit`}>编辑</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPublish(draft)}>
                    发布
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(draft)}>
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}