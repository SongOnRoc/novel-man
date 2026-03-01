"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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

export default function RegisterPage(): React.ReactElement {
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
    onError: (error) => {
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

  function onSubmit(values: z.infer<typeof formSchema>): void {
    const { confirmPassword, ...registerData } = values;
    registerMutation.mutate(registerData);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card overflow-hidden rounded-2xl border border-white/20 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10"
    >
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <UserPlus className="h-6 w-6" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          创建账户
        </h1>
        <p className="text-sm text-muted-foreground">
          加入 Novel Man，开启您的创作之旅
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  用户名
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="您的用户名"
                    className="bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    {...field}
                  />
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
                <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  邮箱
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="name@example.com"
                    className="bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    密码
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="******"
                      className="bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      {...field}
                    />
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
                  <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    确认密码
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="******"
                      className="bg-background/50 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all duration-300"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="pt-2"
          >
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white shadow-lg shadow-primary/20 h-11"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  创建账户 <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <span>已有账户？</span>
        <Link 
          href="/login" 
          className="ml-1 font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
        >
          登录
        </Link>
      </div>
    </motion.div>
  );
}
