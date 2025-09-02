"use client";

import { PlusCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useMemo } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterCard } from "@/features/characters/components/CharacterCard";
import {
  useCharacterList,
  useDeleteCharacter,
} from "@/hooks/character/useCharacters";
import { Character, CharacterList } from "@/lib/services/characters.service";

export default function CharactersPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  }, [searchParams]);

  const {
    data: charactersResponse,
    isLoading,
    error,
  } = useCharacterList({ page });
  const { mutate: deleteCharacter } = useDeleteCharacter();

  const characters = (charactersResponse as CharacterList)?.data || [];
  const pagination = (charactersResponse as CharacterList)?.pagination;

  const totalPages = useMemo(() => {
    if (!pagination || !pagination.total || !pagination.limit) return 1;
    return Math.ceil(pagination.total / pagination.limit);
  }, [pagination]);

  const handleDelete = (characterId: number): void => {
    toast("确定要删除这个角色吗？", {
      action: {
        label: "删除",
        onClick: () =>
          deleteCharacter(characterId, {
            onSuccess: () => toast.success("删除成功"),
            onError: (e: Error) => toast.error(`删除失败: ${e.message}`),
          }),
      },
      cancel: {
        label: "取消",
        onClick: () => {},
      },
    });
  };

  const handlePageChange = (newPage: number): void => {
    router.push(`/tools/characters?page=${newPage}`);
  };

  if (error) return <div>加载角色失败...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">角色库</h1>
        <Button onClick={() => router.push(`/tools/characters/new`)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新建角色
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character: Character) => (
              <CharacterCard
                key={character.id}
                character={character}
                onDelete={() => handleDelete(character.id!)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(page - 1)}
                    />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        onClick={() => handlePageChange(pageNumber)}
                        isActive={page === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(page + 1)}
                    />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
