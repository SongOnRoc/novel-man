"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import {
  useWorldviewItem,
  useUpdateWorldviewItem,
  useWorldviewCategories,
} from "@/hooks/worldbuilding/useWorldviewService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WorldviewCategory,
  WorldviewItem,
} from "@/lib/services/worldview.service";

const worldItemFormSchema = z.object({
  name: z.string().min(1, { message: "条目名称不能为空" }),
  description: z.string().optional(),
  category_id: z.string().min(1, { message: "必须选择一个分类" }),
});

type WorldItemFormValues = z.infer<typeof worldItemFormSchema>;

export default function EditWorldItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params.id
    ? parseInt(Array.isArray(params.id) ? params.id[0] : params.id, 10)
    : null;

  const {
    data: itemResponse,
    isLoading: isLoadingItem,
    error: itemError,
  } = useWorldviewItem(itemId!);

  const { data: categoriesResponse, isLoading: isLoadingCategories } =
    useWorldviewCategories({});
  const categories =
    (categoriesResponse?.data as { data: WorldviewCategory[] })?.data || [];

  const { mutate: updateItem, isPending: isUpdating } =
    useUpdateWorldviewItem();

  const item = (itemResponse?.data as { data: WorldviewItem })?.data;

  const form = useForm<WorldItemFormValues>({
    resolver: zodResolver(worldItemFormSchema),
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        description: item.description || "",
        category_id: item.category_id?.toString() || "",
      });
    }
  }, [item, form]);

  const onSubmit = (values: WorldItemFormValues) => {
    if (!itemId) {
      toast.error("无效的条目ID。");
      return;
    }

    const payload = {
      ...values,
      category_id: parseInt(values.category_id, 10),
    };

    updateItem(
      { id: itemId, data: payload },
      {
        onSuccess: () => {
          toast.success("条目更新成功");
          router.push(`/tools/worldbuilding`);
        },
        onError: (error: Error) => {
          toast.error(`更新失败: ${error.message}`);
          console.error(error);
        },
      }
    );
  };

  if (isLoadingItem || isLoadingCategories) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (itemError) {
    return <div>加载失败: {itemError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">编辑世界观条目</h1>
        <div className="w-24"></div>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>条目信息</CardTitle>
              <CardDescription>修改世界观条目的详细信息。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>条目名称 *</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                      value={field.value}
                      disabled={isLoadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择一个分类..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                disabled={isUpdating}
              >
                取消
              </Button>
              <Button type="submit" disabled={isUpdating}>
                <Save className="mr-2 h-4 w-4" />
                {isUpdating ? "保存中..." : "保存"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
