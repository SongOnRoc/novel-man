"use client";

import { useSession } from "next-auth/react";
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
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSettings } from "@/hooks/settings/useSettings";
import { UserSettings } from "@/types/settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  username: z.string().min(2, "用户名至少需要2个字符。"),
});

const editorFormSchema = z.object({
  fontSize: z.number().min(10).max(30),
  lineHeight: z.number().min(1).max(2),
  autoSave: z.boolean(),
});

const aiFormSchema = z.object({
  defaultWritingStyle: z.string(),
});

const writingStyleOptions = [
  { value: "neutral", label: "中性" },
  { value: "formal", label: "正式" },
  { value: "casual", label: "休闲" },
  { value: "poetic", label: "诗意" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const { settings, saveSettings } = useSettings();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      username: session?.user?.name || "",
    },
  });

  const editorForm = useForm<z.infer<typeof editorFormSchema>>({
    resolver: zodResolver(editorFormSchema),
    values: settings.editor,
  });

  const aiForm = useForm<z.infer<typeof aiFormSchema>>({
    resolver: zodResolver(aiFormSchema),
    values: settings.ai,
  });

  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    // 在实际应用中，这里会调用API更新用户信息
    console.log("Profile updated:", data);
  };

  const onEditorSubmit = (data: z.infer<typeof editorFormSchema>) => {
    saveSettings({ ...settings, editor: data });
  };

  const onAiSubmit = (data: z.infer<typeof aiFormSchema>) => {
    saveSettings({ ...settings, ai: data });
  };

  // 监听编辑器表单变化并自动保存
  editorForm.watch((value) => {
    const currentEditorSettings = editorForm.getValues();
    saveSettings({ ...settings, editor: currentEditorSettings });
  });

  // 监听AI表单变化并自动保存
  aiForm.watch((value) => {
    const currentAiSettings = aiForm.getValues();
    saveSettings({ ...settings, ai: currentAiSettings });
  });

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile">个人资料</TabsTrigger>
          <TabsTrigger value="editor">编辑器设置</TabsTrigger>
          <TabsTrigger value="ai">AI助手设置</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session?.user?.image || ""} />
              <AvatarFallback>{session?.user?.name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-xl font-semibold">{session?.user?.name}</p>
              <p className="text-sm text-muted-foreground">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-8">
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input placeholder="你的昵称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">更新个人资料</Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="editor" className="mt-6">
          <Form {...editorForm}>
            <form onSubmit={editorForm.handleSubmit(onEditorSubmit)} className="space-y-8">
              <FormField
                control={editorForm.control}
                name="fontSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>默认字体大小: {field.value}px</FormLabel>
                    <FormControl>
                      <Slider
                        min={10}
                        max={30}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editorForm.control}
                name="lineHeight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>默认行间距: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={2}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={editorForm.control}
                name="autoSave"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                       <FormLabel>自动保存</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <Button type="submit">保存编辑器设置</Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Form {...aiForm}>
            <form onSubmit={aiForm.handleSubmit(onAiSubmit)} className="space-y-8">
              <FormField
                control={aiForm.control}
                name="defaultWritingStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>默认写作风格</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择一种写作风格" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {writingStyleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">保存AI助手设置</Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
}