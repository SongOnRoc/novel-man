"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Shield, Loader2, ArrowRight } from "lucide-react";
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
import { setStoredAdminSession, type AdminProfile } from "@/lib/admin-auth";

const formSchema = z.object({
  identifier: z.string().min(1, {
    message: "请输入管理员账号或邮箱。",
  }),
  password: z.string().min(1, {
    message: "密码不能为空。",
  }),
});

type LoginFormValues = z.infer<typeof formSchema>;

type AdminMeResponse = {
  email?: string;
  id?: number;
  role?: string;
  username?: string;
};

function normalizeErrorMessage(error: unknown): string {
  if (!error) return "登录失败，请稍后重试。";
  if (typeof error === "string") return error;

  const err = error as {
    message?: string;
    error?: string;
    data?: { message?: string; error?: string };
  };

  return (
    err?.message ||
    err?.error ||
    err?.data?.message ||
    err?.data?.error ||
    "登录失败，请稍后重试。"
  );
}

async function loginAdmin(values: LoginFormValues): Promise<{
  accessToken: string;
  profile: AdminProfile;
}> {
  const loginResponse = await fetch("/api/proxy/auth/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });

  const loginPayload = (await loginResponse.json().catch(() => ({}))) as {
    data?: { accessToken?: string; access_token?: string };
    message?: string;
  };

  if (!loginResponse.ok) {
    throw new Error(loginPayload.message || "管理后台登录失败");
  }

  const loginData = loginPayload.data;
  const accessToken = loginData?.accessToken || loginData?.access_token;
  if (!accessToken) {
    throw new Error("未获取到 Admin Token");
  }

  const meResponse = await fetch("/api/proxy/auth/admin/me", {
    headers: {
      Authorization: accessToken.startsWith("Bearer ")
        ? accessToken
        : `Bearer ${accessToken}`,
    },
  });

  if (!meResponse.ok) {
    const errorText = await meResponse.text().catch(() => "");
    throw new Error(errorText || "获取管理员信息失败");
  }

  const meJson = (await meResponse.json()) as {
    data?: AdminMeResponse;
    message?: string;
  };
  const profile = meJson.data;

  if (!profile) {
    throw new Error(meJson.message || "管理员信息为空");
  }

  return {
    accessToken,
    profile,
  };
}

export default function AdminLoginPage(): React.ReactElement {
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: LoginFormValues): Promise<void> {
    try {
      const result = await loginAdmin(values);
      setStoredAdminSession({
        accessToken: result.accessToken,
        profile: result.profile,
      });

      toast.success("管理后台登录成功", {
        description: `欢迎回来，${result.profile.username || "管理员"}`,
      });

      router.replace("/admin");
    } catch (error) {
      toast.error("管理后台登录失败", {
        description: normalizeErrorMessage(error),
      });
    }
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.10),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%)]" />
      <div className="relative z-10 grid w-full gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6 rounded-3xl border bg-card/80 p-8 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Admin Console
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                管理后台登录
              </div>
            </div>
          </div>

          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            进入独立 Admin
            Workspace，处理后台作业观测、统计修复、失败排查与高风险运维操作。该登录链路与普通用户工作台完全分离。
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border bg-background/70 p-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Identity
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">
                独立 Admin Session
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                不会复用普通用户 `/dashboard` 的 NextAuth 会话。
              </div>
            </div>
            <div className="rounded-2xl border bg-background/70 p-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Auth
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">
                Admin Role Only
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                后端独立校验 `admin/operator`，并签发 admin token。
              </div>
            </div>
            <div className="rounded-2xl border bg-background/70 p-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Safety
              </div>
              <div className="mt-2 text-sm font-semibold text-foreground">
                高风险动作隔离
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                401/退出只影响后台，不影响普通用户登录状态。
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-8 shadow-sm">
          <div className="mb-8 space-y-2">
            <div className="text-sm font-medium text-foreground">
              请输入管理员凭据
            </div>
            <p className="text-sm text-muted-foreground">
              登录成功后将自动建立独立 Admin Session，并跳转到 `/admin` 工作区。
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>管理员账号</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="用户名或邮箱"
                        autoComplete="username"
                        className="h-11 rounded-2xl"
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
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="******"
                        autoComplete="current-password"
                        className="h-11 rounded-2xl"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-11 w-full rounded-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    登录管理后台 <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 rounded-2xl border bg-background/70 p-4 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">提示</div>
            <div className="mt-2 leading-6">
              如果你只是想继续普通创作工作流，请返回普通用户入口；管理后台更适合处理作业、修复和排障。
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <span>返回普通用户入口？</span>
            <Link
              href="/login"
              className="ml-1 font-medium text-primary hover:text-primary/80 hover:underline"
            >
              用户登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
