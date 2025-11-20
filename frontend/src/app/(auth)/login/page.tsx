"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
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
import { useAuth } from "@/hooks/auth/useAuth";

const formSchema = z.object({
  identifier: z.string().min(1, {
    message: "请输入您的用户名或电子邮件。",
  }),
  password: z.string().min(1, {
    message: "密码不能为空。",
  }),
});

export default function LoginPage(): React.ReactElement {
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

  async function onSubmit(values: z.infer<typeof formSchema>): Promise<void> {
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
      console.error("Login error:", error);
      toast.error("登录失败", {
        description: "登录过程中发生错误，请稍后重试。",
      });
    }
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
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
          欢迎回来
        </h1>
        <p className="text-sm text-muted-foreground">
          登录 Novel Man，继续您的创作之旅
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  账号
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="用户名或邮箱"
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
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 text-white shadow-lg shadow-primary/20 h-11" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  登录 <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <span>还没有账户？</span>
        <Link 
          href="/register" 
          className="ml-1 font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
        >
          立即注册
        </Link>
      </div>
    </motion.div>
  );
}
