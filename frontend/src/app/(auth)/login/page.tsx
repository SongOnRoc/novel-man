"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { useLoginMutation } from "@/hooks/auth/useLoginMutation";

const formSchema = z.object({
  identifier: z.string().min(1, {
    message: "请输入您的用户名或电子邮件。",
  }),
  password: z.string().min(1, {
    message: "密码不能为空。",
  }),
});

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLoginMutation({
    onSuccess: () => {
      toast.success("登录成功", {
        description: "欢迎回来！即将跳转到您的工作台...",
      });
      // Redirect after a short delay to allow the user to see the toast
      setTimeout(() => {
        router.push("/");
      }, 1500);
    },
    onError: (error: any) => {
      toast.error("登录失败", {
        description: error?.message || "请检查您的凭据或稍后重试。",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    loginMutation.mutate(values);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">登录</CardTitle>
        <CardDescription>输入您的用户名或邮箱以登录您的账户。</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名或邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="您的用户名或邮箱" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                登录
              </Button>
            </motion.div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm justify-center">
        <span>还没有账户？</span>
        <Link href="/register" className="ml-1 underline">
          立即注册
        </Link>
      </CardFooter>
    </Card>
  );
}
