'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateDraft,
  useUpdateDraft,
} from '@/hooks/draft/useDraftService';
import { useRouter } from 'next/navigation';
import { Draft, CreateDraftPayload } from '@/lib/services/draft.service';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().optional(),
});

interface DraftFormProps {
  workId?: number;
  draft?: Draft;
}

export const DraftForm = ({ workId, draft }: DraftFormProps) => {
  const router = useRouter();
  const createDraftMutation = useCreateDraft();
  const updateDraftMutation = useUpdateDraft();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: draft?.title || '',
      content: draft?.content || '',
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (draft) {
      updateDraftMutation.mutate(
        { id: draft.id!, data: values },
        {
          onSuccess: () => {
            toast.success('Draft updated successfully');
            router.push(workId ? `/drafts?workId=${workId}` : "/drafts");
          },
          onError: (error: any) => {
            toast.error(`Failed to update draft: ${error.message}`);
          },
        }
      );
    } else {
      createDraftMutation.mutate(
        { ...values, work_id: workId } as CreateDraftPayload,
        {
          onSuccess: () => {
            toast.success('Draft created successfully');
            router.push(workId ? `/drafts?workId=${workId}` : "/drafts");
          },
          onError: (error: any) => {
            toast.error(`Failed to create draft: ${error.message}`);
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
                <Input placeholder="Draft title" {...field} />
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
                <Textarea placeholder="Draft content" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {draft ? 'Update Draft' : 'Create Draft'}
        </Button>
      </form>
    </Form>
  );
};