"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GlobalLoading } from "@/components/common/GlobalLoading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetOpsJobsJobId,
  usePostOpsJobsJobIdCancel,
} from "@/lib/api/generated/ops/ops";

function formatDate(value?: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function safeText(value?: string | number | null): string {
  if (value === null || value === undefined) return "-";
  return String(value);
}

function JobStatusBadge({ status }: { status?: string }): React.ReactElement {
  const variant =
    status === "running"
      ? "default"
      : status === "succeeded"
        ? "secondary"
        : status === "failed"
          ? "destructive"
          : status === "canceled"
            ? "outline"
            : "outline";
  return <Badge variant={variant as any}>{status || "-"}</Badge>;
}

function normalizeApiErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const anyErr = error as any;
  return (
    anyErr?.message ||
    anyErr?.errorMessage ||
    anyErr?.error?.message ||
    JSON.stringify(anyErr)
  );
}

type OpsJobDetail = {
  status?: string;
  jobId?: string;
  jobType?: string;
  jobVersion?: string;
  progressDone?: number;
  progressTotal?: number;
  progressFailed?: number;
  traceId?: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  createdAt?: string;
  startedAt?: string;
  updatedAt?: string;
  finishedAt?: string;
  createdByUsername?: string;
  createdByUserId?: number;
  canceledByUserId?: number;
  cancelRequestedAt?: string;
  canceledAt?: string;
  cancelReason?: string;
  errorSummary?: string;
  errorDetails?: string;
  params?: string;
};

function normalizeOpsJobDetail(
  detail: Record<string, unknown> | undefined
): OpsJobDetail | undefined {
  if (!detail) return undefined;

  return {
    status: detail.status as string | undefined,
    jobId:
      (detail.jobId as string | undefined) ??
      (detail.job_id as string | undefined),
    jobType:
      (detail.jobType as string | undefined) ??
      (detail.job_type as string | undefined),
    jobVersion:
      (detail.jobVersion as string | undefined) ??
      (detail.job_version as string | undefined),
    progressDone:
      (detail.progressDone as number | undefined) ??
      (detail.progress_done as number | undefined),
    progressTotal:
      (detail.progressTotal as number | undefined) ??
      (detail.progress_total as number | undefined),
    progressFailed:
      (detail.progressFailed as number | undefined) ??
      (detail.progress_failed as number | undefined),
    traceId:
      (detail.traceId as string | undefined) ??
      (detail.trace_id as string | undefined),
    leaseOwner:
      (detail.leaseOwner as string | undefined) ??
      (detail.lease_owner as string | undefined),
    leaseExpiresAt:
      (detail.leaseExpiresAt as string | undefined) ??
      (detail.lease_expires_at as string | undefined),
    createdAt:
      (detail.createdAt as string | undefined) ??
      (detail.created_at as string | undefined),
    startedAt:
      (detail.startedAt as string | undefined) ??
      (detail.started_at as string | undefined),
    updatedAt:
      (detail.updatedAt as string | undefined) ??
      (detail.updated_at as string | undefined),
    finishedAt:
      (detail.finishedAt as string | undefined) ??
      (detail.finished_at as string | undefined),
    createdByUsername:
      (detail.createdByUsername as string | undefined) ??
      (detail.created_by_username as string | undefined),
    createdByUserId:
      (detail.createdByUserId as number | undefined) ??
      (detail.created_by_user_id as number | undefined),
    canceledByUserId:
      (detail.canceledByUserId as number | undefined) ??
      (detail.canceled_by_user_id as number | undefined),
    cancelRequestedAt:
      (detail.cancelRequestedAt as string | undefined) ??
      (detail.cancel_requested_at as string | undefined),
    canceledAt:
      (detail.canceledAt as string | undefined) ??
      (detail.canceled_at as string | undefined),
    cancelReason:
      (detail.cancelReason as string | undefined) ??
      (detail.cancel_reason as string | undefined),
    errorSummary:
      (detail.errorSummary as string | undefined) ??
      (detail.error_summary as string | undefined),
    errorDetails:
      (detail.errorDetails as string | undefined) ??
      (detail.error_details as string | undefined),
    params: detail.params as string | undefined,
  };
}

export default function OpsJobDetailPage(): React.ReactElement {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();

  const jobId = useMemo(() => {
    const v = params?.jobId;
    return typeof v === "string" ? v : "";
  }, [params?.jobId]);

  const {
    data: detail,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useGetOpsJobsJobId(jobId, {
    query: {
      enabled: Boolean(jobId),
      // running 状态下每 2s 轮询一次。
      // 注意：customFetch 会把 StandardResponse 解包为 data，因此 cached data 形状可能不同。
      // 这里用“安全的 status 提取”避免 refetchInterval 条件失效。
      refetchInterval: (query) => {
        const raw = query.state.data as any;
        const status: string | undefined =
          (raw?.status as string | undefined) ??
          (raw?.data?.status as string | undefined) ??
          (raw?.job?.status as string | undefined);

        return status === "running" ? 2000 : false;
      },
    },
  });

  const job = normalizeOpsJobDetail(
    detail as Record<string, unknown> | undefined
  );

  const [cancelReason, setCancelReason] = useState<string>("");
  const cancelMutation = usePostOpsJobsJobIdCancel({
    mutation: {
      onSuccess: async () => {
        toast.success("已提交取消请求");
        await refetch();
      },
      onError: (e) => {
        toast.error("取消失败", {
          description: normalizeApiErrorMessage(e),
        });
      },
    },
  });

  const canRequestCancel = job?.status === "running" && !job?.cancelRequestedAt;

  const handleRequestCancel = async (): Promise<void> => {
    if (!jobId) return;
    await cancelMutation.mutateAsync({
      jobId,
      data: { reason: cancelReason || undefined },
    } as any);
  };

  return (
    <div className="space-y-8">
      <PageHeader className="space-y-3">
        <PageHeaderHeading>Job 详情</PageHeaderHeading>
        <PageHeaderDescription className="max-w-2xl text-sm leading-6">
          查看作业状态、进度、错误信息和取消请求。
        </PageHeaderDescription>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary" className="rounded-full">
          <Link href="/admin/ops-jobs">返回列表</Link>
        </Button>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => router.push(`/admin/ops-jobs/${jobId}`)}
          disabled={!jobId}
        >
          刷新
        </Button>
      </div>

      {isLoading ? <GlobalLoading fullScreen={false} /> : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">
          加载失败：{normalizeApiErrorMessage(error)}
        </div>
      ) : null}

      {!isLoading && job ? (
        <div className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Job
                  </div>
                  <div className="font-mono text-sm text-foreground break-all">
                    {safeText(job.jobId)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {safeText(job.jobType)} / {safeText(job.jobVersion)}
                  </div>
                </div>
                <JobStatusBadge status={job.status} />
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>执行进度</span>
                  <span className="font-mono">
                    {safeText(job.progressDone)}/{safeText(job.progressTotal)}
                    {job.progressFailed
                      ? ` · failed=${job.progressFailed}`
                      : ""}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width:
                        typeof job.progressDone === "number" &&
                        typeof job.progressTotal === "number" &&
                        job.progressTotal > 0
                          ? `${Math.min(100, (job.progressDone / job.progressTotal) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border bg-background/70 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Trace
                  </div>
                  <div className="mt-2 font-mono text-xs text-foreground">
                    {safeText(job.traceId)}
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/70 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Lease Owner
                  </div>
                  <div className="mt-2 font-mono text-xs text-foreground">
                    {safeText(job.leaseOwner)}
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/70 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    Lease Expires
                  </div>
                  <div className="mt-2 text-sm text-foreground">
                    {formatDate(job.leaseExpiresAt)}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                时间
              </div>
              <div className="mt-4 space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground">created_at</div>
                  <div className="mt-1 text-foreground">
                    {formatDate(job.createdAt)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">started_at</div>
                  <div className="mt-1 text-foreground">
                    {formatDate(job.startedAt)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">updated_at</div>
                  <div className="mt-1 text-foreground">
                    {formatDate(job.updatedAt)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">finished_at</div>
                  <div className="mt-1 text-foreground">
                    {formatDate(job.finishedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
              <div className="border-b px-5 py-4">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  详情
                </div>
                <div className="mt-1 text-lg font-semibold text-foreground">
                  元数据与错误
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>字段</TableHead>
                    <TableHead>值</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      created_by
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {safeText(job.createdByUsername)} (uid=
                      {safeText(job.createdByUserId)})
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      canceled_by_user_id
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {safeText(job.canceledByUserId)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      cancel_requested_at
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDate(job.cancelRequestedAt)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      canceled_at
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatDate(job.canceledAt)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      cancel_reason
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {safeText(job.cancelReason)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      error_summary
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {safeText(job.errorSummary)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      error_details
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap font-mono text-xs">
                      {safeText(job.errorDetails)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-muted-foreground">
                      params
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap font-mono text-xs">
                      {safeText(job.params)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    操作
                  </div>
                  <div className="mt-1 text-lg font-semibold text-foreground">
                    取消作业
                  </div>
                </div>
                {isFetching ? (
                  <div className="text-xs text-muted-foreground">刷新中…</div>
                ) : null}
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="cancelReason">reason（可选）</Label>
                  <Input
                    id="cancelReason"
                    placeholder="例如：误触发 / 参数错误 / 不再需要"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    disabled={!canRequestCancel || cancelMutation.isPending}
                    className="h-11 rounded-2xl"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="destructive"
                    className="rounded-full"
                    disabled={!canRequestCancel || cancelMutation.isPending}
                    onClick={() => {
                      void handleRequestCancel();
                    }}
                  >
                    {cancelMutation.isPending ? "提交中…" : "提交取消请求"}
                  </Button>
                  {!canRequestCancel ? (
                    <div className="text-xs text-muted-foreground">
                      当前状态不可取消，或已提交过取消请求。
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
