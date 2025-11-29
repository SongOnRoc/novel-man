import { MoreVertical, User, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Character } from "@/lib/services/characters.service";

interface CharacterCardProps {
  character: Character;
  onDelete?: () => void;
  onSelect?: (name: string) => void;
}

export function CharacterCard({
  character,
  onDelete,
  onSelect,
}: CharacterCardProps) {
  const handleSelect = () => {
    if (onSelect && character.name) {
      onSelect(character.name);
    }
  };

  return (
    <Card
      className={`flex h-full flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
        onSelect ? "cursor-pointer hover:border-primary" : ""
      }`}
      onClick={onSelect ? handleSelect : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={character.avatar_url || ""} alt={character.name} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              {onSelect ? (
                <CardTitle>{character.name}</CardTitle>
              ) : (
                <Link href={`/tools/characters/${character.id}`}>
                  <CardTitle className="hover:underline">
                    {character.name}
                  </CardTitle>
                </Link>
              )}
              <CardDescription>
                {character.occupation || "未知职业"}
              </CardDescription>
            </div>
          </div>
          {onDelete && (
            <CharacterCardMenu
              characterId={character.id!}
              onDelete={onDelete}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {character.background_story || "暂无背景描述"}
        </p>
      </CardContent>
    </Card>
  );
}

function CharacterCardMenu({
  characterId,
  onDelete,
}: {
  characterId: number;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/tools/characters/${characterId}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            编辑
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
