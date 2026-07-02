# feat-admin-api-v0（Admin Console / Ops 框架）评审与集成方案

> 文档类型：分支评审 + 集成决策  
> 评审对象：`feat-admin-api-v0`（`admin-console-mvp`，提交 `45a357d`）  
> 评审基线：与 `feat/work-layout` 的共同祖先 `6964995`  
> 评审背景：`feat/work-layout` 修复「章节序号从 0 开始」bug 时，讨论到「一次性数据修复」需要可控的运维入口，进而发现运维/数据治理能力应统一化——排查后确认 `feat-admin-api-v0` 已实现一套 ops 运维任务框架 + admin 后台。

---

## 一、ops 框架现状（feat-admin-api-v0 已实现）

**后端**
- `models/ops_job.go`、`ops_job_lock.go`：作业模型（job_id/type/version/status 状态机、`lease_*` 租约、`lock_version`、`progress_*`、审计字段、cancel 两段式字段）
- `repositories/gorm/ops_job_repository.go`（含 lease 抢占/续租）、`ops_job_lock` 仓储
- `services/ops/ops_service.go`：创建/查询/取消/删除/清理
- `services/ops/runner/works_recalc_stats_runner.go`：首个 runner 范本（常驻 loop + lease + 分页扫描 + `EventManager.Dispatch` + progress + cancel + backoff）
- `controllers/ops/handler.go`、`apps/ops/module.go`：`/ops/jobs/*` 路由，挂 `adminAuth + requireOpsRole(admin/operator)`
- `middlewares/auth`、`controllers/auth`：独立 admin JWT（`token_kind=admin` + `admin_role`）

**前端**
- `/admin/login`、`/admin`、`/admin/ops-jobs`（列表+详情）、`/admin/works-stats-repair`
- `components/admin/AdminShell`、`AdminSidebar`、`hooks/auth/useAdminAuth`、`lib/admin-auth`

**设计文档**：`docs/feat/admin-console-mvp/`（ops_jobs 模型与唯一性、runner 详细设计、实现放置评审、UI 等）

---

## 二、评估：设计方向优秀，是生产级雏形 ✅

- **两层拆分**（Ops API + UI）：UI 不阻塞治理，能力可 curl 触发
- **复用现有事件队列**（去重/重试/DLQ/并发限制），不重造统计口径
- **集群安全**：`ops_jobs` + `unique(job_type, running)` + `lease_expires_at` 防 worker 死锁，考虑分布式滚动更新
- **`dry_run` + 审计**（created_by / trace_id）+ **admin/operator 两级权限**（替代临时 `userID==1`）
- **明确「不塞启动链路」**：正好回应「一次性 backfill 不该绑启动」
- 作者留有清醒的演进路线（runner TODO：抽通用引擎 + per-type executor）

---

## 三、关键风险（作者 code-review 已识别，结论 `Changes Requested`）

| 编号 | 级别 | 问题 |
|---|---|---|
| CR-01 | **High** | 锁生命周期与作业生命周期**不一致**：创建用 `ops_job_locks`、执行用 `ops_jobs.lease`，两条并发轴未耦合 → 长任务(>60s)锁过期未续租会**重复创建 running job**；短任务完成后锁未释放会**错误阻塞** |
| CR-02 | **High** | `running` 作业**可被直接硬删/批量清理** → 破坏状态机、runner 幽灵执行、丢失可观测与审计 |
| CR-03 | Medium | 前端 `AdminShell` 守卫**只看本地 token 是否存在**，不校验过期/角色 → 壳层误放行 |
| — | — | 权限 `role` 未落到 `User` 表（靠独立 admin JWT 的 `admin_role`），待硬化；runner 仍是单 job_type 专用（待抽通用引擎） |

> 作者报告还有 CR-04+ 中低优先级项（测试防回归、异常兜底、性能/扩展），完整清单见 `docs/feat/admin-console-mvp/code-review/`。

---

## 四、能否直接合入 `feat/work-layout`——**不建议**

**分支差异（git 数据）**
- merge-base：`6964995`
- `feat/work-layout` 已提交领先：16
- `feat-admin-api-v0` 领先：2（含 admin-console-mvp，共 **95 文件 / +14558 / -345**）
- 潜在冲突文件 8 个，其中 `frontend/src/components/common/layout/sider/Sidebar.tsx`、`frontend/src/lib/fetch.ts` 为**手写核心文件真实冲突**；`docs.go`/`swagger.*`/`api10.schemas.ts` 为生成物（需重新 `api-gen`）

**四条理由**
1. **质量未达标**：作者结论 `Changes Requested`、明确「不建议以当前状态进入更高环境」，且 CR-01/CR-02 为 High
2. **feature 不相关、范围混杂**：work-layout = 作品页 UI 重构 + 章节草稿流程；admin console = 独立运维后台。合一起 → PR 巨大、职责混杂、难聚焦 review/回滚
3. **规模悬殊 + 真实冲突**：admin 侧 95 文件 / +14.5k 行（含大量文档），与当前分支 8 文件冲突
4. **演进阶段错配**：admin 是待修 MVP、work-layout 接近收尾，强合会互相拖累

---

## 五、推荐集成路径（本次采用）

> 用户决策：**基于 `feat/work-layout` 切一个新分支，把 `feat-admin-api-v0` 合入新分支，在新分支继续后续任务。**

- `feat/work-layout`：先把本轮改动上库（UI 重构 + 发布补号 bug 修复 + 编译修复）
- 新分支（based on work-layout）：`merge feat-admin-api-v0`
  - 预期冲突处理：`Sidebar.tsx`、`lib/fetch.ts` 手动合并；`swagger.*` / `api10.schemas.ts` / `docs.go` 重新 `api-gen` 生成
- 在新分支上继续：修 admin CR-01 / CR-02 / CR-03，并新增「章节序号修复」runner（见第六节）

---

## 六、章节序号修复的纳入方案（新分支上做）

「章节序号历史数据修复」与 `works.recalc_stats` 高度同构，天然适合做成第二个 ops job：

- **新增 job_type** `chapters.reindex_display_order`
- **简化版 runner**：扫 `work_id` → 每个 work 按 `(display_order, created_at, id)` 顺序把 `display_order` 重排为连续 `1..N`（仅在检测到 0/重复/不连续时更新，幂等）
  - **无需走 `EventManager`**：works 走事件是为复用 consumer 里的重算逻辑；章节重排逻辑简单且专属，runner 内直接 `UPDATE` 即可
- 复用现成的 job/lease/progress/cancel/admin-UI 骨架，支持 `mode=all|work_id` + `dry_run`
- **暂不抽通用引擎**：作者 TODO 是「后续稳定后」；为第 2 个任务就重构已稳定的 works runner 不划算，等到 3+ 个 job_type 再抽

> 重排逻辑可直接参考 work-layout 分支曾实现、后被移除的 backfill（按 work 分组、`Order("display_order asc, created_at asc, id asc")`、仅不连续时重排 1..N）。

---

## 七、`feat/work-layout` 本次相关改动（已完成，随本分支上库）

- **后端发布补号 bug 修复**：`DraftService.Publish` 之前未设 `display_order`（落 gorm 默认值 0），改为 `max(该作品现有 display_order)+1`（全书连续；用 max 而非 count，避免删除中间章后撞号）+ 回归测试
- **移除 backfill**：历史数据修复交给 ops runner，本分支不留一次性脚本
- **编译修复**：`check_test.go`（`fakeDraftService` 补 `ImportDrafts`/`PublishBatch`）、`WorkMobileStickyActions.tsx`（去冗余 `strokeWidth`）、`ExtractMobileSheet.tsx`（去多余 `onTrigger` prop）

> 遗留：4 个测试文件（`EditorToolbar.test` / `usePromptService.test` / `useLookup.test` / `useAIAssistant.test`，共 43 个类型错误）为更早遗留的 mock/prop 陈旧，不影响生产构建，另开任务处理。

---

## 修订记录
- **初稿**：记录 ops 框架评审、合并可行性评估（不建议直合）、集成路径（新分支合并）、章节序号修复纳入方案。
