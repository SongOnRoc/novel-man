# works.recalc_stats 链路修复与日志补强汇总

## 根因

本次问题实际分为两个层面：

### 1. 真实运行环境未生效的直接原因

结合 [`backend/logs/app.log`](backend/logs/app.log) 可确认，这次用户手动从管理后台创建的任务实际是 `dry_run=true`。

关键证据出现在 [`backend/logs/app.log`](backend/logs/app.log) 第 137-181 行：

- [`backend/logs/app.log`](backend/logs/app.log:137) runner 扫描到 running job
- [`backend/logs/app.log`](backend/logs/app.log:139) lease 抢占成功
- [`backend/logs/app.log`](backend/logs/app.log:143) 开始为 `work_id=1` 准备入队，且 `dry_run=true`
- [`backend/logs/app.log`](backend/logs/app.log:144) 明确记录 `enqueue skipped by dry_run`
- 后续多条 [`backend/logs/app.log`](backend/logs/app.log:145) 到 [`backend/logs/app.log`](backend/logs/app.log:180) 都是同样的 dry-run skip
- 全段日志里**没有**出现 [`backend/internal/services/works/work_service.go`](backend/internal/services/works/work_service.go:77) 新增的 `works stats consumer received task`
- 也没有出现 [`backend/internal/services/works/work_service.go`](backend/internal/services/works/work_service.go:108) 的 `persist succeeded`

这说明：

- runner 已经启动并正常扫描 job
- runner 已经拿到 lease
- 但任务被 dry-run 语义短路
- 所以并没有真正进入 works consumer
- 自然也不会更新 `works.total_word_count / works.total_chapter_count`

而前端页面 [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx:53) 原本默认将 `dryRun` 设为 `true`，这正是本次“创建成功但数据没变”的直接诱因。

### 2. 之前后端修改仍然必要的原因

即使这次直接原因是 `dry_run=true`，前面做的后端修复仍然必要，因为它解决的是两个独立问题：

1. **可观测性不足**
   - 之前日志里几乎看不到 `scan -> lease -> enqueue -> consume -> recompute -> persist` 的完整证据链
   - 现在可以从日志精确定位是 dry-run、缺 consumer、入队失败，还是已经真实写回

2. **假成功风险**
   - 在 [`backend/internal/events/manager.go`](backend/internal/events/manager.go) 原逻辑下，如果 route 存在但 consumer 未注册，会只打 warning 然后继续返回成功
   - 这会导致 runner job 被误判为 `succeeded`，但 works consumer 其实根本没执行
   - 现在 runner 会在入队前检查 route/consumer 完整性，缺 consumer 时直接失败，而不是假成功

所以结论是：

- 本次“数据没变化”的直接原因是前端默认 `dry_run=true`
- 前面的后端修改是为了补齐证据链、避免假成功、提升排障能力，仍然是必要修复

## 修改摘要

### 后端：runner 链路与日志补强

#### 1. 新增 dispatch plan 检查，阻止假成功

在 [`backend/internal/events/manager.go`](backend/internal/events/manager.go) 中新增：

- `DispatchPlan`
- `BuildDispatchPlan()`

runner 现在在 [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:364) 入队前先检查：

- 当前事件是否存在 route
- route 对应模块是否缺 consumer

若缺少 consumer，则直接让 job 失败，而不是继续成功完成。

#### 2. runner 增加关键日志

在 [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go) 中补充以下日志：

- runner 启动
- 扫描到 running job
- 选中 job
- lease 抢占成功 / 跳过 / 失败
- lease 续租成功 / 丢失 / 失败
- progress_total 初始化
- work batch 扫描
- enqueue prepared
- enqueue dispatched
- enqueue skipped by dry_run
- enqueue failed / backoff
- progress flush
- execution succeeded / failed

#### 3. works consumer 增加关键日志

在 [`backend/internal/services/works/work_service.go`](backend/internal/services/works/work_service.go) 中补充以下日志：

- 收到 task
- 解析 `work_id` 失败
- 加载 work 失败
- 列章节失败
- 重算 totals
- unchanged skip
- persist succeeded / failed

#### 4. 修正失败进度持久化

在 [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go) 中修复失败路径的 progress flush，保证 `progress_failed` 能落盘。

### 前端：修复默认行为并提升后台体验

在 [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx) 中完成以下优化：

1. 将 `dryRun` 默认值从 `true` 改为 `false`
2. 增强“试跑模式 / 正式执行”视觉状态表达
3. 在页面头部明确说明试跑与正式执行的差异
4. 在 `dry_run` 区块增加醒目的结果提示：
   - 试跑：不会写回数据
   - 正式执行：会写回数据
5. 提交按钮文案按模式动态变化：
   - `创建试跑作业`
   - `创建正式修复作业`
6. 增加模式说明与日志验证提示
7. 优化 payload 预览区的验证引导
8. 修复若干前端类型细节，消除页面 lint 报告中的 warning

## 修改文件列表

- [`backend/internal/events/manager.go`](backend/internal/events/manager.go)
- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go)
- [`backend/internal/services/works/work_service.go`](backend/internal/services/works/work_service.go)
- [`backend/internal/services/ops/runner/works_recalc_stats_runner_test.go`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go)
- [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx)

## 日志样例

### 1. 服务启动与 runner 正常工作

- [`backend/logs/app.log`](backend/logs/app.log:70) `ops works recalc runner started`
- [`backend/logs/app.log`](backend/logs/app.log:72) 周期扫描开始

### 2. 本次问题的直接证据：dry-run 被跳过

- [`backend/logs/app.log`](backend/logs/app.log:137) `scanned running jobs count=1`
- [`backend/logs/app.log`](backend/logs/app.log:138) `picked job`
- [`backend/logs/app.log`](backend/logs/app.log:139) `lease acquired`
- [`backend/logs/app.log`](backend/logs/app.log:143) `enqueue prepared ... dry_run=true`
- [`backend/logs/app.log`](backend/logs/app.log:144) `enqueue skipped by dry_run`
- [`backend/logs/app.log`](backend/logs/app.log:181) `execution succeeded`

这组日志证明：job 成功只是“试跑成功”，不是“真实重算成功”。

### 3. 真实成功链路应看到的日志

真实执行时，应该同时出现以下类型日志：

- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:162) `scanned running jobs`
- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:205) `lease acquired`
- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:365) `enqueue prepared`
- [`backend/internal/services/ops/runner/works_recalc_stats_runner.go`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:381) `enqueue dispatched`
- [`backend/internal/services/works/work_service.go`](backend/internal/services/works/work_service.go:77) `works stats consumer received task`
- [`backend/internal/services/works/work_service.go`](backend/internal/services/works/work_service.go:97) `recomputed totals`
- [`backend/internal/services/works/work_service.go`](backend/internal/services/works/work_service.go:108) `persist succeeded`

## 自动化验证

### 后端测试

已执行：

```bash
go test ./internal/services/ops/runner -count=1
```

结果：通过。

覆盖点包括：

1. [`backend/internal/services/ops/runner/works_recalc_stats_runner_test.go`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go) 中的真实链路测试
   - 使用真实章节统计覆盖历史脏数据
   - 最终写回 `works.total_*`

2. 同文件中的缺少 consumer 失败测试
   - route 存在但 consumer 缺失时，job 必须失败

3. 同文件中的 `HandleWorkStatsTask` 测试
   - 按 `work_id` 过滤章节
   - 用真实章节统计覆盖历史 totals

### 前端检查

已执行：

```bash
cd frontend && npm run lint -- --file "src/app/(main)/admin/works-stats-repair/page.tsx"
```

结果：通过，无 lint 警告或错误。

## 现在的验证方式

### 方式一：管理后台手工验证

1. 打开 [`frontend/src/app/(main)/admin/works-stats-repair/page.tsx`](frontend/src/app/(main)/admin/works-stats-repair/page.tsx)
2. 默认应处于“正式执行”状态，而不是“试跑模式”
3. 先选 `work_id` 并填入单个作品 ID
4. 点击“创建正式修复作业”
5. 跳转到 job 详情页后，等待 job 完成
6. 查看后端日志，确认出现：
   - `enqueue dispatched`
   - `works stats consumer received task`
   - `recomputed totals`
   - `persist succeeded`
7. 刷新作品详情/列表，确认 `total_word_count` 与 `total_chapter_count` 已按真实章节更新

### 方式二：日志判定标准

如果只看到：

- `enqueue skipped by dry_run`

说明只是试跑，没有真实执行。

如果看到：

- `enqueue dispatched`
- `works stats consumer received task`
- `persist succeeded`

才说明真实链路已经跑通并写回数据库。

## 验收对应关系

- 发起 `works.recalc_stats` job 后，链路能真正走到 works consumer 并写回 `works.total_*`：已通过测试覆盖，且前端默认行为已修正，避免再次误用 dry-run。
- 日志能明确证明 `scan -> lease -> enqueue -> consume -> recompute -> persist`：已补齐。
- 至少有一条测试覆盖“真实章节统计覆盖历史 works.total_*”：已覆盖。
- 汇总文档列出所有修改文件和验证方式：已完成。
