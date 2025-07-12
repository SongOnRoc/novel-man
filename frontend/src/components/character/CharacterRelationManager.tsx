"use client";

import React, { useState } from "react";
import {
  Character,
  CharacterRelationship,
  RelationshipType,
  relationshipTypes,
  relationshipTypeMap,
} from "@/types/character";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "../ui/label";

interface CharacterRelationManagerProps {
  characterId: string;
  allCharacters: Character[];
  relations: CharacterRelationship[];
  onAddRelation: (targetId: string, type: RelationshipType) => void;
  onDeleteRelation: (relationId: string) => void;
  onUpdateRelationType: (relationId: string, newType: RelationshipType) => void;
}

export function CharacterRelationManager({
  characterId,
  allCharacters,
  relations,
  onAddRelation,
  onDeleteRelation,
  onUpdateRelationType,
}: CharacterRelationManagerProps) {
  const [newRelationTarget, setNewRelationTarget] = useState("");
  const [newRelationType, setNewRelationType] =
    useState<RelationshipType>("friend");
  const [customRelationType, setCustomRelationType] = useState("");

  const handleAddRelation = () => {
    if (newRelationTarget) {
      const typeToAdd = customRelationType.trim() || newRelationType;
      onAddRelation(newRelationTarget, typeToAdd);
      setNewRelationTarget("");
      setCustomRelationType("");
    }
  };

  // Filter out the current character from the list of potential targets
  const availableTargets = allCharacters.filter((c) => c.id !== characterId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>角色关系</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing Relations List */}
        <div className="space-y-4">
          <Label>现有关系</Label>
          {relations.length > 0 ? (
            relations.map((rel) => {
              const otherCharacterId =
                rel.sourceId === characterId ? rel.targetId : rel.sourceId;
              const otherCharacter = allCharacters.find(
                (c) => c.id === otherCharacterId
              );

              if (!otherCharacter) return null;

              const isCustomType = !relationshipTypes.includes(rel.type);

              return (
                <div
                  key={rel.id}
                  className="flex items-center justify-between gap-2 p-2 border rounded-lg"
                >
                  <span className="font-medium">{otherCharacter.name}</span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={rel.type}
                      onValueChange={(value: RelationshipType) =>
                        onUpdateRelationType(rel.id, value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="关系类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {relationshipTypeMap[type] || type}
                          </SelectItem>
                        ))}
                        {isCustomType && (
                          <SelectItem key={rel.type} value={rel.type}>
                            {rel.type}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRelation(rel.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">暂无关系</p>
          )}
        </div>

        {/* Add New Relation Form */}
        <div className="space-y-4 pt-4 border-t">
          <Label>添加新关系</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
            <div className="space-y-1">
              <Label htmlFor="target-char" className="text-xs">
                目标角色
              </Label>
              <Select
                value={newRelationTarget}
                onValueChange={setNewRelationTarget}
              >
                <SelectTrigger id="target-char">
                  <SelectValue placeholder="选择一个角色..." />
                </SelectTrigger>
                <SelectContent>
                  {availableTargets.map((char) => (
                    <SelectItem key={char.id} value={char.id}>
                      {char.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="relation-type" className="text-xs">
                预设关系
              </Label>
              <Select
                value={newRelationType}
                onValueChange={(v: RelationshipType) => setNewRelationType(v)}
              >
                <SelectTrigger id="relation-type">
                  <SelectValue placeholder="关系类型" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {relationshipTypeMap[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="custom-relation" className="text-xs">
                或 自定义关系
              </Label>
              <Input
                id="custom-relation"
                placeholder="输入自定义关系"
                value={customRelationType}
                onChange={(e) => setCustomRelationType(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleAddRelation}
              disabled={
                !newRelationTarget || (!newRelationType && !customRelationType)
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              添加
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
