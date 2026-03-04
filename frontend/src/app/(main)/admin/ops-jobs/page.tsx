"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  GetOpsJobsParams,
  ModelsOpsJob,
} from "@/lib/api/generated/api10.schemas";
import {
  useDeleteOpsJobs,
  useDeleteOpsJobsJobId,
  useGetOpsJobs,
  useGetOpsJobsJobId,
} from "@/lib/api/generated/ops/ops";

function formatDate(value?: string): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function safeNumber(n?: number): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return "-";
  return String(n);
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

type OpsJobRow = {
  jobId?: string;
  jobType?: string;
  status?: string;
  progressDone?: number;
  progressTotal?: number;
  progressFailed?: number;
  errorSummary?: string;
  updatedAt?: string;
};

function normalizeOpsJob(
  job: ModelsOpsJob | Record<string, unknown>
): OpsJobRow {
  const source = job as Record<string, unknown>;

  return {
    jobId:
      (source.jobId as string | undefined) ??
      (source.job_id as string | undefined),
    jobType:
      (source.jobType as string | undefined) ??
      (source.job_type as string | undefined),
    status: source.status as string | undefined,
    progressDone:
      (source.progressDone as number | undefined) ??
      (source.progress_done as number | undefined),
    progressTotal:
      (source.progressTotal as number | undefined) ??
      (source.progress_total as number | undefined),
    progressFailed:
      (source.progressFailed as number | undefined) ??
      (source.progress_failed as number | undefined),
    errorSummary:
      (source.errorSummary as string | undefined) ??
      (source.error_summary as string | undefined),
    updatedAt:
      (source.updatedAt as string | undefined) ??
      (source.updated_at as string | undefined),
  };
}

export default function OpsJobsPage(): React.ReactElement {
  const searchParams = useSearchParams();
  const createdJobId = useMemo(() => {
    const v = searchParams?.get("created_job_id");
    return typeof v === "string" && v.trim() ? v.trim() : undefined;
  }, [searchParams]);

  const [type, setType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const limit = 20;

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    jobId?: string;
  }>({ open: false });

  const [clearConfirm, setClearConfirm] = useState<{ open: boolean }>({
    open: false,
  });

  const params = useMemo((): GetOpsJobsParams => {
    return {
      page,
      limit,
      type: type || undefined,
      status: status || undefined,
    };
  }, [page, type, status]);

  const { data, isLoading, error, refetch } = useGetOpsJobs(params, {
    query: {
      // 列表页轻量轮询：用于让 running 任务的 progress 自动推进。
      // 频率控制：4s 一次，避免过多请求；如后续需要可做成仅在存在 running 时启用。
      refetchInterval: 4000,
    },
  });

  const deleteJobMutation = useDeleteOpsJobsJobId({
    mutation: {
      onSuccess: async () => {
        await refetch();
      },
    },
  });

  const clearJobsMutation = useDeleteOpsJobs({
    mutation: {
      onSuccess: async () => {
        await refetch();
      },
    },
  });

  const list = (
    Array.isArray((data as any)?.data)
      ? (data as any).data
      : Array.isArray(data)
        ? data
        : []
  ).map((job: ModelsOpsJob | Record<string, unknown>) => normalizeOpsJob(job));

  // 乐观插入：从创建页带回 created_job_id 时，先把该 job 拉取出来并插到列表顶部。
  // 这样用户能“立即看到刚创建的 job”，后续再由列表轮询推进进度。
  const { data: createdJobDetail } = useGetOpsJobsJobId(createdJobId || "", {
    query: {
      enabled: Boolean(createdJobId),
      refetchInterval: (query: { state: { data: unknown } }) => {
        const raw = query.state.data as any;
        const s: string | undefined =
          (raw?.status as string | undefined) ??
          (raw?.data?.status as string | undefined) ??
          (raw?.job?.status as string | undefined);
        return s === "running" ? 2000 : false;
      },
      staleTime: 0,
    },
  });

  const optimisticTop = useMemo((): OpsJobRow | undefined => {
    if (!createdJobId || !createdJobDetail) return undefined;
    const normalized = normalizeOpsJob(createdJobDetail as any);
    if (!normalized.jobId) {
      normalized.jobId = createdJobId;
    }
    if (!normalized.status) {
      normalized.status = "running";
    }
    return normalized;
  }, [createdJobId, createdJobDetail]);

  const listWithOptimistic = useMemo((): OpsJobRow[] => {
    if (!optimisticTop) return list;
    const rest = list.filter((j: OpsJobRow) => j.jobId !== optimisticTop.jobId);
    return [optimisticTop, ...rest];
  }, [list, optimisticTop]);
  const pagination = (data as any)?.pagination as
    | { total?: number; page?: number; limit?: number }
    | undefined;

  const totalPages = useMemo(() => {
    const total = pagination?.total ?? 0;
    return Math.ceil(total / limit) || 1;
  }, [pagination?.total]);

  return (
    <div className="space-y-8">
      <PageHeader className="space-y-3">
        <PageHeaderHeading>Ops Jobs</PageHeaderHeading>
        <PageHeaderDescription className="max-w-2xl text-sm leading-6">
          查看后台作业列表，并按类型、状态筛选。
        </PageHeaderDescription>
      </PageHeader>

      <div className="rounded-3xl border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-foreground">筛选</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="destructive"
              className="rounded-full"
              onClick={() => setClearConfirm({ open: true })}
            >
              清理队列（当前筛选）
            </Button>

            <Button asChild variant="secondary" className="rounded-full">
              <Link href="/admin/works-stats-repair">创建修复任务</Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Input
              id="type"
              placeholder='例如: "works.recalc_stats"'
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={status || "__all__"}
              onValueChange={(v) => {
                setStatus(v === "__all__" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="全部" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部</SelectItem>
                <SelectItem value="running">running</SelectItem>
                <SelectItem value="succeeded">succeeded</SelectItem>
                <SelectItem value="failed">failed</SelectItem>
                <SelectItem value="canceled">canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? <GlobalLoading fullScreen={false} /> : null}

      {error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive shadow-sm">
          加载失败：{(error as any)?.message || "Unknown error"}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Queue
            </div>
            <div className="mt-1 text-lg font-semibold text-foreground">
              后台作业队列
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {pagination?.total ?? list.length} 条记录
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>job_id</TableHead>
              <TableHead>type</TableHead>
              <TableHead>status</TableHead>
              <TableHead>progress</TableHead>
              <TableHead>error_summary</TableHead>
              <TableHead>updated_at</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {listWithOptimistic.map((job: OpsJobRow, index: number) => {
              const rowKey =
                job.jobId ||
                [job.jobType, job.status, job.updatedAt, index].join("-");

              return (
                <TableRow key={rowKey} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">
                    {job.jobId || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {job.jobType || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <JobStatusBadge status={job.status} />
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[180px] space-y-2">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-mono text-muted-foreground">
                        {safeNumber(job.progressDone)}/
                        {safeNumber(job.progressTotal)}
                      </span>
                      {job.progressFailed ? (
                        <span className="text-destructive">
                          failed={job.progressFailed}
                        </span>
                      ) : null}
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
                  </TableCell>
                  <TableCell className="max-w-[360px] text-xs leading-6 text-muted-foreground">
                    <div className="line-clamp-2">
                      {job.errorSummary || "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(job.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        disabled={!job.jobId}
                        onClick={() =>
                          setDeleteConfirm({ open: true, jobId: job.jobId })
                        }
                      >
                        删除
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                      >
                        <Link href={`/admin/ops-jobs/${job.jobId}`}>详情</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {!isLoading && listWithOptimistic.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="mx-auto max-w-sm space-y-2 text-sm text-muted-foreground">
                    <div className="text-base font-medium text-foreground">
                      当前没有匹配的作业
                    </div>
                    <div>请调整筛选条件，或创建新的修复任务。</div>
                  </div>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex justify-center pt-2">
          <Pagination>
            <PaginationContent>
              {page > 1 ? (
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
              ) : null}

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNumber) => (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageNumber}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              {page < totalPages ? (
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              ) : null}
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}

      {/* 删除单条确认 */}
      {deleteConfirm.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-6 shadow-xl">
            <div className="space-y-1">
              <div className="text-lg font-semibold">永久删除作业</div>
              <div className="text-sm text-muted-foreground">
                该操作将从数据库中永久删除 job 记录，无法恢复。
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-3 text-xs">
              <div className="font-mono">
                job_id: {deleteConfirm.jobId || "-"}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setDeleteConfirm({ open: false })}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                className="rounded-full"
                disabled={!deleteConfirm.jobId || deleteJobMutation.isPending}
                onClick={async () => {
                  const jobId = deleteConfirm.jobId;
                  if (!jobId) return;
                  await deleteJobMutation.mutateAsync({ jobId });
                  setDeleteConfirm({ open: false });
                }}
              >
                {deleteJobMutation.isPending ? "删除中..." : "确认永久删除"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 清理队列确认 */}
      {clearConfirm.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-6 shadow-xl">
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                清理队列（按当前筛选）
              </div>
              <div className="text-sm text-muted-foreground">
                该操作将按当前筛选条件（包含分页）永久删除 job 记录，无法恢复。
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/30 p-3 text-xs space-y-1">
              <div className="font-mono">type: {type || "(all)"}</div>
              <div className="font-mono">status: {status || "(all)"}</div>
              <div className="font-mono">page: {page}</div>
              <div className="font-mono">limit: {limit}</div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setClearConfirm({ open: false })}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                className="rounded-full"
                disabled={clearJobsMutation.isPending}
                onClick={async () => {
                  await clearJobsMutation.mutateAsync({
                    params: {
                      page,
                      limit,
                      type: type || undefined,
                      status: status || undefined,
                    },
                  });
                  setClearConfirm({ open: false });
                }}
              >
                {clearJobsMutation.isPending ? "清理中..." : "确认清理"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
