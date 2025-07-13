import { Character } from "@/types/character";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface CharacterCardProps {
  character: Character;
  onSelect?: (name: string) => void;
}

export function CharacterCard({
  character,
  onSelect,
  children,
}: {
  character: Character;
  onSelect?: (name: string) => void;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 阻止事件冒泡到展开/折叠按钮
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onSelect?.(character.name);
  };

  return (
    <Card className="mb-3 cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{character.name}</CardTitle>
            <CardDescription>
              {character.occupation || "未知职业"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-1">
            {children}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="text-sm">
          {character.personality && character.personality.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">性格：</span>
              <span>{character.personality.join("、")}</span>
            </div>
          )}

          {character.abilities && character.abilities.length > 0 && (
            <div className="mb-2">
              <span className="font-medium">能力：</span>
              <span>{character.abilities.join("、")}</span>
            </div>
          )}

          {character.background && (
            <div className="mb-2">
              <span className="font-medium">背景：</span>
              <p className="mt-1 text-muted-foreground line-clamp-3">
                {character.background}
              </p>
            </div>
          )}

          {character.appearance && (
            <div>
              <span className="font-medium">外貌：</span>
              <p className="mt-1 text-muted-foreground line-clamp-2">
                {character.appearance}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
