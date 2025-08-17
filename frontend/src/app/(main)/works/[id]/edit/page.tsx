"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useWorkById, useUpdateWork } from "@/hooks/work/useWorkService";
import { Skeleton } from "@/components/ui/skeleton";
import { Work, UpdateWorkPayload } from "@/lib/services/work.service";

// 定义表单验证模式
const formSchema = z.object({
  title: z
    .string()
    .min(2, { message: "标题至少需要2个字符" })
    .max(100, { message: "标题不能超过100个字符" }),
  description: z
    .string()
    .max(500, { message: "描述不能超过500个字符" })
    .optional(),
  category: z.string().min(1, { message: "请选择一个类型" }),
  status: z.string().min(1, { message: "请选择一个状态" }),
});

// 选项
const categoryOptions = [
  "玄幻",
  "修真",
  "都市",
  "历史",
  "科幻",
  "悬疑",
  "游戏",
  "轻小说",
  "其他",
];
const statusOptions = ["连载中", "完结"];

export default function EditWorkPage() {
  const router = useRouter();
  const params = useParams();
  const workId = Number(params.id);

  const { data: workResponse, isLoading } = useWorkById(workId);
  const work = workResponse?.data as Work;
  const { mutate: updateWork, isPending: isSubmitting } = useUpdateWork();

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      status: "",
    },
  });

  useEffect(() => {
    if (work) {
      form.reset({
        title: work.title || '',
        description: work.description || '',
        category: work.category || '',
        status: work.status || '',
      });
    }
  }, [work, form]);

  // 表单提交处理
  function onSubmit(values: z.infer<typeof formSchema>) {
    const updateData: UpdateWorkPayload = {
      ...values,
      description: values.description || "",
    };
    updateWork(
      { id: workId, data: updateData },
      {
        onSuccess: () => {
          router.push("/works");
        },
        onError: (error) => {
          console.error("更新作品失败:", error);
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-80 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!work) {
    return <div>作品未找到。</div>;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和返回按钮 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/works">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">返回</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">编辑作品信息</h1>
          <p className="text-muted-foreground">更新您的作品详情。</p>
        </div>
      </div>

      {/* 表单卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>作品信息</CardTitle>
          <CardDescription>修改作品的基本信息。</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 标题字段 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作品标题</FormLabel>
                    <FormControl>
                      <Input placeholder="输入作品标题" {...field} />
                    </FormControl>
                    <FormDescription>
                      一个好的标题能吸引更多读者。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 类型字段 */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作品类型</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="" disabled>
                          选择作品类型
                        </option>
                        {categoryOptions.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>选择最符合您作品的类型。</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 状态字段 */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作品状态</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="" disabled>
                          选择作品状态
                        </option>
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormDescription>设置作品当前的连载状态。</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 描述字段 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>作品简介</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="简要描述您的作品内容和亮点"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      简洁有力的描述可以让读者更好地了解您的作品。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 表单按钮 */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/works")}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "保存中..." : "保存更改"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
