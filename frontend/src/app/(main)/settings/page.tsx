// "use client";

// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Slider } from "@/components/ui/slider";
// import { Switch } from "@/components/ui/switch";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { useSettings } from "@/hooks/settings/useSettings";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useEffect } from "react";
// import { toast } from "sonner";

// // 定义用户设置表单验证规则
// const userSettingsSchema = z.object({
//   aiModel: z.enum(["gpt-4", "claude-3", "custom"]),
//   customApiEndpoint: z.string().optional(),
//   editorTheme: z.enum(["light", "dark"]),
//   fontSize: z.number().min(10).max(30),
//   lineHeight: z.number().min(1).max(2),
// });

// export default function SettingsPage() {
//   const { settings, isLoading, updateSettings, isUpdating } = useSettings();

//   // 初始化表单
//   const form = useForm<z.infer<typeof userSettingsSchema>>({
//     resolver: zodResolver(userSettingsSchema),
//     defaultValues: {
//       aiModel: "gpt-4",
//       customApiEndpoint: "",
//       editorTheme: "light",
//       fontSize: 16,
//       lineHeight: 1.5,
//     },
//   });

//   // 当设置加载完成时，重置表单值
//   useEffect(() => {
//     if (settings) {
//       form.reset({
//         aiModel: settings.aiModel,
//         customApiEndpoint: settings.customApiEndpoint,
//         editorTheme: settings.editorTheme,
//         fontSize: settings.fontSize,
//         lineHeight: settings.lineHeight,
//       });
//     }
//   }, [settings, form]);

//   // 表单提交处理
//   const onSubmit = async (data: z.infer<typeof userSettingsSchema>) => {
//     try {
//       await updateSettings(data);
//       toast.success("设置已保存");
//     } catch (error) {
//       toast.error("保存设置失败");
//     }
//   };

//   return (
//     <div className="container mx-auto py-10">
//       <h1 className="text-2xl font-bold mb-6">设置</h1>

//       {isLoading ? (
//         <div className="flex justify-center items-center h-64">
//           <p>加载设置中...</p>
//         </div>
//       ) : (
//         <Tabs defaultValue="editor" className="w-full">
//           <TabsList>
//             <TabsTrigger value="editor">编辑器设置</TabsTrigger>
//             <TabsTrigger value="ai">AI助手设置</TabsTrigger>
//           </TabsList>

//           <Form {...form}>
//             <form onSubmit={form.handleSubmit(onSubmit)}>
//               <TabsContent value="editor" className="mt-6 space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="editorTheme"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>编辑器主题</FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         value={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="选择主题" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="light">浅色模式</SelectItem>
//                           <SelectItem value="dark">深色模式</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="fontSize"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>字体大小: {field.value}px</FormLabel>
//                       <FormControl>
//                         <Slider
//                           min={10}
//                           max={30}
//                           step={1}
//                           value={[field.value]}
//                           onValueChange={(vals) => field.onChange(vals[0])}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="lineHeight"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>行间距: {field.value}</FormLabel>
//                       <FormControl>
//                         <Slider
//                           min={1}
//                           max={2}
//                           step={0.1}
//                           value={[field.value]}
//                           onValueChange={(vals) => field.onChange(vals[0])}
//                         />
//                       </FormControl>
//                     </FormItem>
//                   )}
//                 />
//               </TabsContent>

//               <TabsContent value="ai" className="mt-6 space-y-6">
//                 <FormField
//                   control={form.control}
//                   name="aiModel"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>AI模型</FormLabel>
//                       <Select
//                         onValueChange={field.onChange}
//                         value={field.value}
//                       >
//                         <FormControl>
//                           <SelectTrigger>
//                             <SelectValue placeholder="选择AI模型" />
//                           </SelectTrigger>
//                         </FormControl>
//                         <SelectContent>
//                           <SelectItem value="gpt-4">GPT-4</SelectItem>
//                           <SelectItem value="claude-3">Claude 3</SelectItem>
//                           <SelectItem value="custom">自定义</SelectItem>
//                         </SelectContent>
//                       </Select>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {form.watch("aiModel") === "custom" && (
//                   <FormField
//                     control={form.control}
//                     name="customApiEndpoint"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>自定义API地址</FormLabel>
//                         <FormControl>
//                           <Input
//                             placeholder="https://api.example.com"
//                             {...field}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />
//                 )}
//               </TabsContent>

//               <div className="mt-6">
//                 <Button type="submit" disabled={isUpdating}>
//                   {isUpdating ? "保存中..." : "保存设置"}
//                 </Button>
//               </div>
//             </form>
//           </Form>
//         </Tabs>
//       )}
//     </div>
//   );
// }
