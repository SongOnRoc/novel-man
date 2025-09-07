"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateWorldviewItem,
  useWorldviewCategories,
} from "@/hooks/worldbuilding/useWorldviewService";
import {
  WorldviewCategory,
  WorldviewCategoryList,
} from "@/lib/services/worldview.service";

const worldItemFormSchema = z.object({
  name: z.string().min(1, { message: "条目名称不能为空" }),
  description: z.string().optional(),
  category_id: z.string().min(1, { message: "必须选择一个分类" }),
});

type WorldItemFormValues = z.infer<typeof worldItemFormSchema>;

export default function NewWorldItemPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryIdFromUrl = searchParams.get("categoryId");
  const { mutate: createItem, isPending: isCreating } =
    useCreateWorldviewItem();
  const { data: categoriesResponse, isLoading: isLoadingCategories } =
    useWorldviewCategories({ limit: 999 });
  const categories = (categoriesResponse as WorldviewCategoryList)?.data || [];

  const form = useForm<WorldItemFormValues>({
    resolver: zodResolver(worldItemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category_id: categoryIdFromUrl || "",
    },
  });

  const onSubmit = (values: WorldItemFormValues): void => {
    const payload = {
      ...values,
      category_id: parseInt(values.category_id, 10),
    };

    createItem(payload, {
      onSuccess: () => {
        toast.success("条目创建成功");
        router.push("/tools/worldbuilding");
      },
      onError: (error: Error) => {
        toast.error(`创建失败: ${error.message}`);
        console.error(error);
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="新建世界观条目"
        description="填写新世界观条目的详细信息。"
      />

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>条目信息</CardTitle>
              <CardDescription>填写新世界观条目的详细信息。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>条目名称 *</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：灵根、筑基期" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属分类 *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择一个分类..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent position="popper">
                        {categories.map((category: WorldviewCategory) => (
                          <SelectItem
                            key={category.id}
                            value={category.id!.toString()}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>条目描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="简要描述这个设定的内容。"
                        rows={5}
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
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isCreating}
              >
                取消
              </Button>
              <Button type="submit" disabled={isCreating}>
                <Save className="mr-2 h-4 w-4" />
                {isCreating ? "保存中..." : "保存"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
