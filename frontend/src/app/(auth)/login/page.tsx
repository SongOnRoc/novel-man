"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
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
  const { login } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const result = await login(values);

      if (result?.ok) {
        toast.success("登录成功", {
          description: "欢迎回来！即将跳转到您的工作台...",
        });

        router.replace("/dashboard");
      } else {
        toast.error("登录失败", {
          description: result?.error || "请检查您的凭据或稍后重试。",
        });
      }
    } catch (error) {
      toast.error("登录失败", {
        description: "登录过程中发生错误，请稍后重试。",
      });
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">登录</CardTitle>
        <CardDescription>输入您的用户名或邮箱以登录您的账户。</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
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
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && (
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
