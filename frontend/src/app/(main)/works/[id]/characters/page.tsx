"use client";

import { Plus, Search } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteItemDialog } from "@/components/common/DeleteItemDialog";
import { GlobalLoading } from "@/components/common/GlobalLoading";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { CharacterCard } from "@/features/characters/components/CharacterCard";
import { useCharacters, useDeleteCharacter } from "@/hooks/character/useCharacters";
import { useWorkById } from "@/hooks/work/useWorkService";
import { Character } from "@/lib/services/characters.service";

export default function CharactersPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const workId = typeof params.id === "string" ? parseInt(params.id, 10) : NaN;
  const isValidWorkId = Number.isInteger(workId) && workId > 0;
  const validWorkId = isValidWorkId ? workId : undefined;
  const { setBreadcrumb } = useBreadcrumb();
  const [searchQuery, setSearchQuery] = useState("");
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

  const { data: work, isLoading: isLoadingWork } = useWorkById(validWorkId);
  const { data: charactersResponse, isLoading: isLoadingCharacters } = useCharacters(validWorkId);
  const { mutate: deleteCharacter, isPending: isDeleting } = useDeleteCharacter();

  const allCharacters = useMemo(
    () => ((charactersResponse as { data?: Character[] } | undefined)?.data || []),
    [charactersResponse],
  );

  const filteredCharacters = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (!normalizedSearch) {
      return allCharacters;
    }

    return allCharacters.filter((character) => {
      const name = character.name?.toLowerCase() || "";
      const occupation = character.occupation?.toLowerCase() || "";
      return name.includes(normalizedSearch) || occupation.includes(normalizedSearch);
    });
  }, [allCharacters, searchQuery]);

  useEffect(() => {
    if (work) {
      setBreadcrumb(`works-${workId}`, work.title || "角色管理");
    }
  }, [work, workId, setBreadcrumb]);

  const handleConfirmDelete = () => {
    if (!characterToDelete) return;

    deleteCharacter(characterToDelete.id!, {
      onSuccess: () => {
        toast.success("角色已删除");
        setCharacterToDelete(null);
      },
      onError: () => {
        toast.error("删除失败");
      },
    });
  };

  if (!isValidWorkId) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">无效的作品 ID</h2>
        <p className="text-muted-foreground">请从作品列表重新进入角色管理页面。</p>
        <Button variant="outline" onClick={() => router.push("/works")}>
          返回作品列表
        </Button>
      </div>
    );
  }

  if (isLoadingWork) {
    return <GlobalLoading fullScreen={false} />;
  }

  if (!work) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-semibold">作品不存在</h2>
        <p className="text-muted-foreground">该作品可能已被删除或无访问权限。</p>
        <Button variant="outline" onClick={() => router.push("/works")}>
          返回作品列表
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen space-y-8 pb-20 animate-in fade-in duration-500">
        <PageHeader
          title={work.title || "角色管理"}
          description="维护当前作品相关角色，并保留每个子页面自己的独立视觉结构。"
          backButton={{ href: `/works/${workId}`, label: "返回作品" }}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href={`/works/${workId}`}>返回作品总览</Link>
              </Button>
              <Button asChild>
                <Link href={`/works/${workId}/characters/new`}>
                  <Plus className="mr-2 h-4 w-4" />
                  创建角色
                </Link>
              </Button>
            </div>
          }
        />

        <div className="space-y-6 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm md:p-6">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <CharacterInsightCard
              title="当前上下文"
              value={`作品 ID：${work.id}`}
              description="角色页保持独立样式，但仍展示当前作品上下文。"
            />
            <CharacterInsightCard
              title="数据边界"
              value="暂未实现严格作品隔离"
              description="后端尚未支持 work_id 过滤，当前列表用于承接真实角色链路。"
            />
            <CharacterInsightCard
              title="可用操作"
              value="搜索 / 创建 / 删除"
              description="先保持角色页独立闭环，后续再扩展关系网和章节联动。"
            />
            <CharacterInsightCard
              title="角色结果数"
              value={`${filteredCharacters.length}`}
              description={
                searchQuery
                  ? `当前按“${searchQuery}”过滤结果。`
                  : "当前展示角色查询结果，用于辅助整理作品角色资产。"
              }
            />
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索角色姓名或身份"
                className="pl-9"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              当前搜索结果用于辅助整理角色资产，不表示这些角色已经全部与当前作品建立强关联。
            </p>
          </div>

          {isLoadingCharacters ? (
            <GlobalLoading fullScreen={false} />
          ) : filteredCharacters.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharacters.map((character, index) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <CharacterCard
                    character={character}
                    workId={workId}
                    onDelete={() => setCharacterToDelete(character)}
                    onSelect={() => {}}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
              <h2 className="text-2xl font-semibold">暂无角色</h2>
              <p className="mb-6 mt-2 text-muted-foreground">
                当前还没有可展示的角色数据。你可以先创建角色资产；后续待后端支持后，再收敛为严格的作品内角色列表。
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href={`/works/${workId}/characters/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    创建角色
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/works/${workId}`}>返回作品总览</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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
    </>
  );
}

function CharacterInsightCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-border/50 bg-background/70 p-4">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-base font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
