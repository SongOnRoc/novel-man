"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  PlayCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  OpsCreateWorksRecalcStatsJobMode,
  type OpsCreateWorksRecalcStatsJobRequest,
} from "@/lib/api/generated/api10.schemas";
import { usePostOpsJobsWorksRecalcStats } from "@/lib/api/generated/ops/ops";

type Mode = "all" | "work_id" | "predicate";

function parsePredicateJson(text: string): Record<string, unknown> | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    const v: unknown = JSON.parse(trimmed);
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      throw new Error("predicate 必须是 JSON object");
    }
    return v as Record<string, unknown>;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "predicate JSON 解析失败";
    throw new Error(message);
  }
}

function extractJobId(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  // customFetch 会把 StandardResponse 解包为其 data 字段，并做 camelCase 转换。
  // 因此这里需要同时兼容：
  // - { job_id: string } (少数情况仍可能存在)
  // - { jobId: string }
  // - { data: { job_id } } / { data: { jobId } } (未解包或二次封装)
  const candidate = payload as {
    job_id?: unknown;
    jobId?: unknown;
    data?: unknown;
  };

  const direct =
    (typeof candidate.jobId === "string" && candidate.jobId) ||
    (typeof candidate.job_id === "string" && candidate.job_id);
  if (direct) return direct;

  if (candidate.data && typeof candidate.data === "object") {
    const nested = candidate.data as { job_id?: unknown; jobId?: unknown };
    const nestedId =
      (typeof nested.jobId === "string" && nested.jobId) ||
      (typeof nested.job_id === "string" && nested.job_id);
    if (nestedId) return nestedId;
  }

  return undefined;
}

function extractErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "创建作业失败";
}

export default function WorksStatsRepairPage(): React.ReactElement {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("all");
  const [workIdText, setWorkIdText] = useState<string>("");
  const [predicateText, setPredicateText] = useState<string>("{");
  const [dryRun, setDryRun] = useState<boolean>(false);

  const mutation = usePostOpsJobsWorksRecalcStats();

  const requestPayload = useMemo((): OpsCreateWorksRecalcStatsJobRequest => {
    const base: OpsCreateWorksRecalcStatsJobRequest = {
      mode:
        mode === "all"
          ? OpsCreateWorksRecalcStatsJobMode.CreateWorksRecalcStatsJobModeAll
          : mode === "work_id"
            ? OpsCreateWorksRecalcStatsJobMode.CreateWorksRecalcStatsJobModeWorkID
            : OpsCreateWorksRecalcStatsJobMode.CreateWorksRecalcStatsJobModePredicate,
      dry_run: dryRun,
    };

    if (mode === "work_id") {
      const n = Number.parseInt(workIdText, 10);
      if (Number.isFinite(n) && n > 0) {
        base.work_id = n;
      }
    }

    if (mode === "predicate") {
      // predicate may be omitted by backend MVP rules, but UI validates JSON if provided
      const parsed = parsePredicateJson(predicateText);
      if (parsed) base.predicate = parsed;
    }

    return base;
  }, [dryRun, mode, predicateText, workIdText]);

  const canSubmit = useMemo(() => {
    if (mutation.isPending) return false;
    if (mode === "work_id") {
      const n = Number.parseInt(workIdText, 10);
      return Number.isFinite(n) && n > 0;
    }
    if (mode === "predicate") {
      try {
        parsePredicateJson(predicateText);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }, [mode, mutation.isPending, predicateText, workIdText]);

  const modeDescription = useMemo(() => {
    if (mode === "all") {
      return "扫描全部作品并重算统计，适合全量纠偏。";
    }
    if (mode === "work_id") {
      return "仅修复单个作品，适合快速验证真实链路是否跑通。";
    }
    return "按条件批量筛选；当前 MVP 更适合作为审计/试验入口。";
  }, [mode]);

  const executionTone = dryRun
    ? {
        label: "试跑模式",
        description:
          "本次只会扫描并记录日志，不会真正入队到 works consumer，也不会更新 works.total_*。",
        badgeClass:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
        panelClass:
          "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/20",
        icon: FlaskConical,
      }
    : {
        label: "正式执行",
        description:
          "本次会真实入队并触发 works consumer，成功后会覆盖 works.total_word_count / works.total_chapter_count。",
        badgeClass:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
        panelClass:
          "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/20",
        icon: PlayCircle,
      };

  const ExecutionIcon = executionTone.icon;

  const onSubmit = async (): Promise<void> => {
    try {
      const res = await mutation.mutateAsync({ data: requestPayload });
      const jobId = extractJobId(res);

      toast.success("已创建作业", {
        description: jobId ? `job_id=${jobId}` : "",
      });

      // 目标体验：创建后立刻在列表可见（不必等待下一次轮询）。
      // 这里统一跳回列表页，并把 job_id 带回去供列表页做“乐观插入”。
      if (jobId) {
        router.push(
          `/admin/ops-jobs?created_job_id=${encodeURIComponent(jobId)}`
        );
      } else {
        router.push(`/admin/ops-jobs`);
      }
    } catch (e: unknown) {
      const msg = extractErrorMessage(e);
      toast.error("创建失败", { description: msg });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader className="space-y-3">
        <PageHeaderHeading>Works Stats Repair</PageHeaderHeading>
        <PageHeaderDescription className="max-w-2xl text-sm leading-6">
          创建作品统计修复任务。
        </PageHeaderDescription>
      </PageHeader>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold text-foreground">
                修复参数
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${executionTone.badgeClass}`}
            >
              <ExecutionIcon className="h-4 w-4" />
              {executionTone.label}
            </div>
          </div>

          <div className="mt-6 space-y-6">
            <div
              className={`rounded-2xl border p-4 ${executionTone.panelClass}`}
            >
              <div className="flex items-start gap-3">
                <ExecutionIcon className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">
                    {executionTone.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {executionTone.description}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Mode</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger className="h-11 rounded-2xl w-full max-w-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">all</SelectItem>
                  <SelectItem value="work_id">work_id</SelectItem>
                  <SelectItem value="predicate">predicate</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{modeDescription}</p>
            </div>

            {mode === "work_id" ? (
              <div className="grid gap-2">
                <Label htmlFor="workId">work_id</Label>
                <Input
                  id="workId"
                  placeholder="例如: 123"
                  value={workIdText}
                  onChange={(e) => setWorkIdText(e.target.value)}
                  className="h-11 max-w-sm rounded-2xl"
                />
              </div>
            ) : null}

            {mode === "predicate" ? (
              <div className="grid gap-2">
                <Label htmlFor="predicate">predicate（JSON 文本）</Label>
                <Textarea
                  id="predicate"
                  value={predicateText}
                  onChange={(e) => setPredicateText(e.target.value)}
                  className="min-h-[200px] rounded-2xl font-mono text-xs"
                  placeholder='例如: {"total_word_count": 0, "has_chapters": true}'
                />
                <p className="text-xs text-muted-foreground">
                  请输入合法 JSON 对象。
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border bg-background/70 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Switch checked={dryRun} onCheckedChange={setDryRun} />
                  <div className="grid gap-1">
                    <span className="text-sm font-medium">dry_run</span>
                    <span className="text-xs text-muted-foreground">
                      开启后仅试跑，不写回数据；关闭后执行真实修复。
                    </span>
                  </div>
                </div>
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${executionTone.badgeClass}`}
                >
                  {dryRun ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  {dryRun ? "不会写回数据" : "会写回数据"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-full"
                onClick={() => void onSubmit()}
                disabled={!canSubmit}
              >
                {mutation.isPending
                  ? "提交中..."
                  : dryRun
                    ? "创建试跑作业"
                    : "创建正式修复作业"}
              </Button>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => router.push("/admin/ops-jobs")}
              >
                返回 Ops Jobs
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            请求体
          </div>
          <div className="mt-2 text-lg font-semibold text-foreground">预览</div>
          <div className="mt-3 text-xs text-muted-foreground">
            {dryRun ? "当前为试跑。" : "当前为正式执行。"}
          </div>
          <pre className="mt-4 overflow-auto rounded-2xl border bg-background/80 p-4 text-xs leading-6 text-muted-foreground">
            {JSON.stringify(requestPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
