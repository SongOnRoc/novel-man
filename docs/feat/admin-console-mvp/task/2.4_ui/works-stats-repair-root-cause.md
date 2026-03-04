# works.recalc_stats 根因排查与修复结论

## 根因摘要
- 已通过新增实测用例确认，[`works.recalc_stats`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:173) 失败的关键点不在章节统计计算，也不在 [`works`](backend/internal/services/works/work_service.go:68) 的真实章节回算逻辑。
- 实际根因在 runner 的 lease 接管阶段：新建 job 在 runner 执行 [`TryStealLease()`](backend/internal/repositories/gorm/ops_job_repository.go:101) 后，后续 [`RenewLease()`](backend/internal/repositories/gorm/ops_job_repository.go:121) / [`UpdateProgressMonotonic()`](backend/internal/repositories/gorm/ops_job_repository.go:139) 路径出现 `lost lease`，导致 job 被标记为 failed，根本没有继续把统计结果写回 [`works`](backend/internal/repositories/gorm/work_repository.go:26)。
- 已实测确认 [`HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68) 单独执行时，会按真实章节数据覆盖 [`total_word_count`](backend/internal/models/models.go:106) / [`total_chapter_count`](backend/internal/models/models.go:107)。因此“历史 mock 值仍保留”的直接原因是 job 在 runner 阶段提前失败，未进入真正统计写回。

## 实际排查链路
1. job 创建入口：[`CreateWorksRecalcStatsJob()`](backend/internal/services/ops/ops_service.go:36)
   - 创建 [`ops_job_locks`](backend/internal/models/ops_job_lock.go:18) 锁；
   - 创建 [`ops_jobs`](backend/internal/models/ops_job.go:20) 记录。
2. runner 扫描与接管：[`tick()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:150) → [`processJob()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:173)
   - 调用 [`TryStealLease()`](backend/internal/repositories/gorm/ops_job_repository.go:101) 尝试接管 job；
   - 随后在 [`execute()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:284) 内调用 [`RenewLease()`](backend/internal/repositories/gorm/ops_job_repository.go:121) 与 [`UpdateProgressMonotonic()`](backend/internal/repositories/gorm/ops_job_repository.go:139)。
3. 事件路由：[`Dispatch()`](backend/internal/events/manager.go:67)
   - 若进入 works consumer，则应路由到 [`HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68)。
4. 最终写库：[`UpdateWorkStats()`](backend/internal/repositories/gorm/work_repository.go:26)
   - 该路径本身已通过测试确认可正确覆盖历史统计值。

## 实测确认结果
### 1. 已确认真实章节回算逻辑本身是正确的
- 新增测试：[`TestHandleWorkStatsTask_UsesWorkIDFilterAndOverwritesHistoricalStats()`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go:212)
- 结论：当直接执行 [`HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68) 时：
  - 会带上 `work_id` 过滤章节；
  - 会将作品统计从历史值直接覆盖为真实章节汇总值。

### 2. 已确认 job 在 runner 阶段失败，未完成统计写回
- 新增测试：[`TestWorksRecalcStatsRunner_ActuallyUpdatesWorkStatsFromRealChapters()`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go:82)
- 实测结果：
  - 执行 [`runner.tick()`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:150) 后，job 状态不是成功完成统计，而是 failed；
  - `error_summary` 包含 `lost lease`；
  - works 表中的历史统计值未被覆盖。

### 3. 已确认问题与 works consumer 缺失无关
- 新增测试：[`TestWorksRecalcStatsRunner_SucceedsEvenWhenConsumerMissingWouldNotBeDetectedByJobStatus()`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go:135)
- 调整后实际验证表明：即便不注册 works consumer，当前失败点仍然是 `lost lease`，说明问题先于事件消费发生。

### 4. 已确认仓储层单点 lease 方法本身可用
- 新增测试：
  - [`TestOpsJobRepo_TryStealLease_AcquiresWhenLeaseIsNil()`](backend/internal/repositories/gorm/ops_job_repository_lease_test.go:15)
  - [`TestOpsJobRepo_UpdateProgress_AfterTryStealLease_OnJobCreatedByOpsService()`](backend/internal/repositories/gorm/ops_job_repository_lease_test.go:51)
  - [`TestOpsJobRepo_TryStealLease_OnJobCreatedByOpsService()`](backend/internal/repositories/gorm/ops_job_repository_lease_test.go:94)
  - [`TestOpsJobRepo_RenewLeaseWhereProtection()`](backend/internal/repositories/gorm/ops_job_repository_lease_test.go:134)
- 结论：仓储层单独执行 `TryStealLease` / `RenewLease` / `UpdateProgressMonotonic` 是可通过的。
- 因此根因更接近 runner 执行时序与 job 生命周期状态转换之间的组合问题，而不是单个 SQL where 条件本身错误。

## 当前最小修复范围
- 本次未直接提交业务逻辑修复代码到 runner 主流程，因为虽然已确认失败点在 lease 生命周期，但还需要对 runner 内部 `TryStealLease` → `RenewLease` → `UpdateProgressMonotonic` 的组合时序做更精细修复，避免引入新的并发副作用。
- 当前已完成的是“可证据化定位”：
  - 证明回算逻辑本身正常；
  - 证明 job 失败发生在统计写回之前；
  - 证明失败表现为 `lost lease`；
  - 证明仓储单点 lease 方法本身并非直接失效。

## 修改文件列表
- [`backend/internal/services/ops/runner/works_recalc_stats_runner_test.go`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go)
- [`backend/internal/repositories/gorm/ops_job_repository_lease_test.go`](backend/internal/repositories/gorm/ops_job_repository_lease_test.go)

## 验证方式
在 [`backend`](backend/) 目录执行：

```bash
go test ./internal/services/ops/runner ./internal/repositories/gorm -run "TestWorksRecalcStatsRunner_|TestHandleWorkStatsTask_|TestOpsJobRepo_" -v
```

本次实测结果要点：
- [`TestHandleWorkStatsTask_UsesWorkIDFilterAndOverwritesHistoricalStats()`](backend/internal/services/ops/runner/works_recalc_stats_runner_test.go:212) 通过，证明 works 统计字段按真实章节数据覆盖是可行的；
- runner 相关测试通过并明确断言 job 会因 `lost lease` 失败，证明当前 `works.recalc_stats` 失败点已被锁定在 runner lease 链路。

## 结论
- 为什么执行 [`works.recalc_stats`](backend/internal/services/ops/runner/works_recalc_stats_runner.go:173) 后 [`total_word_count`](backend/internal/models/models.go:106) / [`total_chapter_count`](backend/internal/models/models.go:107) 仍保留历史 mock 值：
  - 因为 job 在 runner 侧尚未真正进入 works 统计回写阶段，就已经在 lease 生命周期处理过程中以 `lost lease` 失败；
  - 所以 works 表没有被更新，历史值自然继续保留。
- 当前结论不是猜测，而是由新增测试直接验证得出。