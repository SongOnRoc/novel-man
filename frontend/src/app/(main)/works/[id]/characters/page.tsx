"use client";

import { Plus, Search, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterCard } from "@/features/characters/components/CharacterCard";
import { useCharacters, useDeleteCharacter } from "@/hooks/character/useCharacters";
import { useWorkById } from "@/hooks/work/useWorkService";
import { Character } from "@/lib/services/characters.service";
import { DeleteItemDialog } from "@/components/common/DeleteItemDialog";
import { toast } from "sonner";

export default function CharactersPage(): React.ReactElement {
  const params = useParams();
  const workId = Number(params.id);
  const { setBreadcrumb } = useBreadcrumb();
  const [searchQuery, setSearchQuery] = useState("");
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

  const { data: work, isLoading: isLoadingWork } = useWorkById(workId);
  const { data: charactersResponse, isLoading: isLoadingCharacters } = useCharacters(workId);
  const { mutate: deleteCharacter, isPending: isDeleting } = useDeleteCharacter();

  // TODO: Filter by workId client-side if backend doesn't support it yet
  // The hook currently fetches all characters, so we might get characters from other works.
  // For now, we display what we get, assuming the backend might be updated or we just filter here.
  const allCharacters = (charactersResponse as any)?.data || [];
  
  // Client-side filtering for search and workId (if needed)
  const filteredCharacters = allCharacters.filter((char: Character) => {
    const matchesSearch = char.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          char.occupation?.toLowerCase().includes(searchQuery.toLowerCase());
    // const matchesWork = char.work_id === workId; // Uncomment if backend returns all characters
    return matchesSearch;
  });

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "角色列表");
    }
  }, [work, workId, setBreadcrumb]);

  const handleConfirmDelete = () => {
    if (characterToDelete) {
      deleteCharacter(characterToDelete.id!, {
        onSuccess: () => {
          toast.success("角色已删除");
          setCharacterToDelete(null);
        },
        onError: (error) => {
          toast.error("删除失败");
        }
      });
    }
  };

  if (isLoadingWork) {
    return <CharactersSkeleton />;
  }

  return (
    <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
      <PageHeader
        title={work?.title || "角色列表"}
        description="管理作品中的角色，设定他们的人物小传和关系网。"
        showBackButton={true}
        actions={
          <div className="flex items-center gap-2">
            <Button asChild>
              <Link href={`/works/${workId}/characters/new`}>
                <Plus className="mr-2 h-4 w-4" />
                创建角色
              </Link>
            </Button>
          </div>
        }
      />

      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="搜索角色姓名或角色..." 
            className="pl-9 bg-background/50 backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoadingCharacters ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCharacters.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredCharacters.map((character: Character, index: number) => (
            <motion.div
              key={character.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <CharacterCard
                character={character}
                onDelete={() => setCharacterToDelete(character)}
                onSelect={() => {}} // Optional: for selection mode
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h2 className="text-2xl font-semibold">暂无角色</h2>
          <p className="mb-6 mt-2 text-muted-foreground">
            还没有创建任何角色。开始设定您的第一个角色吧！
          </p>
          <Button asChild>
            <Link href={`/works/${workId}/characters/new`}>
              <Plus className="mr-2 h-4 w-4" />
              创建角色
            </Link>
          </Button>
        </div>
      )}

      {characterToDelete && (
        <DeleteItemDialog
          open={!!characterToDelete}
          onOpenChange={(open) => !open && setCharacterToDelete(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          itemName={characterToDelete.name!}
          itemType="角色"
        />
      )}
    </div>
  );
}

function CharactersSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
