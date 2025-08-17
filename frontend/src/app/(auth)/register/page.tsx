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
import { useRegisterMutation } from "@/hooks/auth/useRegisterMutation";

const formSchema = z
  .object({
    username: z
      .string()
      .min(4, {
        message: "用户名至少需要4个字符。",
      })
      .max(32, {
        message: "用户名不能超过32个字符。",
      }),
    email: z.string().email({
      message: "请输入有效的电子邮件。",
    }),
    password: z.string().min(8, {
      message: "密码至少需要8个字符。",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "密码不匹配。",
    path: ["confirmPassword"],
  });

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation({
    onSuccess: () => {
      toast.success("注册成功", {
        description: "您的账户已创建，现在将跳转到登录页面。",
      });
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    },
    onError: (error: Error) => {
      toast.error("注册失败", {
        description: error?.message || "该用户名或邮箱已被使用。",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // We don't need to send `confirmPassword` to the backend.
    const { confirmPassword: _, ...registerData } = values;
    registerMutation.mutate(registerData);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">注册</CardTitle>
        <CardDescription>输入您的信息以创建新帐户。</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input placeholder="您的用户名" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
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
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
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
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                创建帐户
              </Button>
            </motion.div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm justify-center">
        <span>已有账户？</span>
        <Link href="/login" className="ml-1 underline">
          登录
        </Link>
      </CardFooter>
    </Card>
  );
}
