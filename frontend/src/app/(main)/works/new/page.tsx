"use client";

import { useRouter } from "next/navigation";
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
import { useCreateWork } from "@/hooks/work/useWorks";
import { CreateWorkData } from "@/types/work";

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
});

// 类型选项
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

// 新作品页面组件
export default function NewWorkPage() {
  const router = useRouter();
  const { mutate: createWork, isPending: isSubmitting } = useCreateWork();

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
    },
  });

  // 表单提交处理
  function onSubmit(values: z.infer<typeof formSchema>) {
    const newWorkData: CreateWorkData = {
      ...values,
      description: values.description || "",
      coverImageUrl: "", // 暂时为空
      status: "ongoing",
    };

    createWork(newWorkData, {
      onSuccess: () => {
        router.push("/works");
      },
      onError: (error) => {
        console.error("创建作品失败:", error);
        // 这里可以添加错误处理，如显示错误消息
      },
    });
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
          <h1 className="text-3xl font-bold tracking-tight">创建新作品</h1>
          <p className="text-muted-foreground">
            填写基本信息，开始您的新创作之旅。
          </p>
        </div>
      </div>

      {/* 表单卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>作品信息</CardTitle>
          <CardDescription>
            填写您的新作品的基本信息，您可以稍后编辑这些信息。
          </CardDescription>
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
                  {isSubmitting ? "创建中..." : "创建作品"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
