"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { PageHeader } from "@/components/common/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCharacter,
  useUpdateCharacter,
} from "@/hooks/character/useCharacters";
import {
  useRelationshipList,
  useCreateRelationship,
  useDeleteRelationship,
} from "@/hooks/relationship/useRelationshipService";
import { useWorkList } from "@/hooks/work/useWorkService";
import {
  UpdateCharacterPayload,
  Character,
} from "@/lib/services/characters.service";
import { Work } from "@/lib/services/work.service";

const characterFormSchema = z.object({
  name: z.string().min(1, { message: "角色名称不能为空" }),
  workId: z.string().min(1, { message: "必须选择一个所属作品" }),
  gender: z.string().optional(),
  age: z.coerce.number().optional(),
  occupation: z.string().optional(),
  personality: z.string().optional(),
  abilities: z.string().optional(),
  background: z.string().optional(),
  appearance: z.string().optional(),
  notes: z.string().optional(),
});

type CharacterFormValues = z.infer<typeof characterFormSchema>;

interface Relationship {
  id?: number;
  source_entity_id?: number;
  // Add other properties of relationship here
}

export default function EditCharacterPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams();
  const { setBreadcrumb } = useBreadcrumb();
  const characterId = Number(
    Array.isArray(params.id) ? params.id[0] : params.id
  );

  const { data: characterResponse, isLoading: isLoadingCharacter } =
    useCharacter(characterId);
  const { data: worksData } = useWorkList({});
  const { data: relationshipData, isLoading: isLoadingRelationship } =
    useRelationshipList(
      {
        targetEntityId: characterId,
        targetEntityType: "character",
        sourceEntityType: "work",
      },
      { enabled: !!characterId }
    );

  const { mutate: updateCharacter, isPending: isUpdatingCharacter } =
    useUpdateCharacter();
  const { mutate: createRelationship, isPending: isCreatingRelationship } =
    useCreateRelationship();
  const { mutate: deleteRelationship, isPending: isDeletingRelationship } =
    useDeleteRelationship();

  const works = (worksData?.data as { data?: Work[] })?.data || [];
  const character = characterResponse as Character;
  const relationship = (relationshipData?.data as { data?: Relationship[] })
    ?.data?.[0];

  const form = useForm<CharacterFormValues>({
    resolver: zodResolver(characterFormSchema),
  });

  useEffect(() => {
    if (character) {
      setBreadcrumb(
        `characters-${characterId}`,
        character.name || "编辑角色"
      );
      if (relationship) {
        form.reset({
          name: character.name || "",
          workId: relationship.source_entity_id?.toString() || "",
          gender: character.gender || "",
          age: character.age || 0,
          occupation: character.occupation || "",
          personality: character.personality || "",
          abilities: character.abilities || "",
          background: character.background_story || "",
          appearance: character.appearance || "",
          notes: character.notes || "",
        });
      }
    }
  }, [character, relationship, form, characterId, setBreadcrumb]);

  const onSubmit = (values: CharacterFormValues): void => {
    const { workId, ...characterData } = values;

    const updatePayload: UpdateCharacterPayload = {
      ...characterData,
      age: characterData.age || 0,
    };

    updateCharacter(
      { id: characterId, data: updatePayload },
      {
        onSuccess: () => {
          const newWorkId = parseInt(workId, 10);
          const oldWorkId = relationship?.source_entity_id;

          if (relationship && newWorkId !== oldWorkId) {
            deleteRelationship(
              { id: relationship.id! },
              {
                onSuccess: () => {
                  createRelationship(
                    {
                      data: {
                        source_entity_id: newWorkId,
                        source_entity_type: "work",
                        target_entity_id: characterId,
                        target_entity_type: "character",
                        relationship_type: "associates",
                      },
                    },
                    {
                      onSuccess: () => router.push(`/tools/characters`),
                    }
                  );
                },
              }
            );
          } else {
            router.push(`/tools/characters`);
          }
        },
      }
    );
  };

  const isLoading = isLoadingCharacter || isLoadingRelationship;
  const isPending =
    isUpdatingCharacter || isCreatingRelationship || isDeletingRelationship;

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="编辑角色"
        description="修改角色的基本信息，带 * 的字段为必填项"
      />

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>角色信息</CardTitle>
              <CardDescription>
                修改角色的基本信息，带 * 的字段为必填项
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder="输入角色名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>职业/身份</FormLabel>
                      <FormControl>
                        <Input placeholder="如：修真者、丹药师" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年龄</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="输入年龄"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性别</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择性别" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">男</SelectItem>
                          <SelectItem value="female">女</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="workId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属作品 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择一个作品..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {works.map((work) => (
                          <SelectItem
                            key={work.id}
                            value={work.id?.toString() ?? ""}
                          >
                            {work.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>性格特点</FormLabel>
                      <FormControl>
                        <Input placeholder="如：坚韧,聪慧,重情义" {...field} />
                      </FormControl>
                      <FormDescription>用逗号分隔</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="abilities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>能力</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="如：火属性灵力,炼丹术,剑法"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>用逗号分隔</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="background"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>背景故事</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="描述角色的背景故事、经历和动机"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="appearance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>外貌描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="描述角色的外貌特征、穿着和气质"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>笔记</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="其他需要记录的信息"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
                disabled={isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "保存中..." : "保存更改"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
