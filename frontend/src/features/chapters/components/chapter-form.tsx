"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateChapter,
  useUpdateChapter,
} from "@/hooks/chapter/useChapterService";
import { useRouter } from "next/navigation";
import { Chapter, CreateChapterPayload } from "@/lib/services/chapter.service";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
  status: z.string().optional(),
});

interface ChapterFormProps {
  workId: number;
  chapter?: Chapter;
}

export const ChapterForm = ({ workId, chapter }: ChapterFormProps) => {
  const router = useRouter();
  const createChapterMutation = useCreateChapter();
  const updateChapterMutation = useUpdateChapter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: chapter?.title || "",
      content: chapter?.content || "",
      status: chapter?.status || "draft",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (chapter) {
      updateChapterMutation.mutate(
        { id: chapter.id!, data: values },
        {
          onSuccess: () => {
            router.push(`/works/${workId}/chapters`);
          },
        }
      );
    } else {
      createChapterMutation.mutate(
        { ...values, work_id: workId },
        {
          onSuccess: () => {
            router.push(`/works/${workId}/chapters`);
          },
        }
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Chapter title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea placeholder="Chapter content" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {chapter ? "Update Chapter" : "Create Chapter"}
        </Button>
      </form>
    </Form>
  );
};
