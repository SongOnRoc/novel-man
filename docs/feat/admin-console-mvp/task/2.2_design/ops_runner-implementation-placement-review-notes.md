# Ops Runner 落点方案复盘（更易读版）

这份复盘的目标很简单：把我们讨论 `ops runner`（`works.recalc_stats`）时**真正做的关键判断**写下来，方便以后回头看“为什么要这么放、这么接、为什么不用改 concurrency 表”。

正式落点方案在 [`tasks/admin-console-mvp/2.2_design/ops_runner-implementation-placement.md`](tasks/admin-console-mvp/2.2_design/ops_runner-implementation-placement.md:1)。本文件只复盘讨论过程与补充解释（尤其是你后来追问的“启动时机/端口、扫描风暴与退让”）。

---

## 一、先把这件事“是什么”讲清楚

我们要做的 runner 不是一个新服务，也不是一个新队列系统；它更像是：

> **一个进程内常驻 goroutine**，负责把 `ops_jobs` 里 `works.recalc_stats` 这种 job，从“有人创建了”推进到“投递完成/终态落盘”，
> 但 **真正的重算执行**仍然交给 works 模块现有 consumer：[`WorkService.HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68)。

这句话决定了后面所有落点：

- runner 属于 ops 域（因为围绕 `ops_jobs`/lease/cancel/progress 写入）。
- 投递要走现有 events/scheduler 管道（因为要复用 works consumer 和既有去重/重试/DLQ/并发槽位）。
- 并发治理的“阀门”应该在 `works` module，而不是 ops。

---

## 二、为什么 runner 放在 `backend/internal/services/ops/runner`

直观一点：runner 每天做的事情是“扫 ops_jobs、续租 lease、在正确的 where 条件下更新进度/终态、遇到 cancel 做 ack”。这些都是 ops 的业务一致性约束，而不是 works 的统计逻辑。

现有 ops 模块入口在 [`backend/internal/apps/ops/module.go`](backend/internal/apps/ops/module.go:1)；它做的是 repo/service/controller 的注册与路由挂载（更像 wiring）。runner 是一个长期运行的执行器，更像 service 的后台形态，所以放 `services/ops/*` 更贴合项目分层。

核心收益是：

- **ops 的一致性写入规则不会泄漏到别的模块**（尤其不想把 lease/cancel/progress 逻辑塞到 events 或 works）。
- 后续如果 ops 增加更多 job_type，不需要重新找落点，只是在 `services/ops/runner` 里扩展 executor 即可。

---

## 三、runner 不随 API 启动？那到底什么时候启动、要不要端口？

这里我们需要先对齐一个事实：当前后端是一个 cobra 命令程序，入口是 [`backend/main.go`](backend/main.go:12) 调 [`cmd.Execute()`](backend/internal/cmd/root.go:84)。

当执行 `api` 命令时：

1. 先跑 [`backend/internal/cmd/root.go`](backend/internal/cmd/root.go:26) 的 `PersistentPreRun`：初始化 DB、把 `*gorm.DB` Provide 到容器、跑 migrate。
2. 再进入 [`backend/internal/cmd/api.go`](backend/internal/cmd/api.go:27) 的 `Run`：初始化 gin / middlewares / routes，并启动 HTTP server。

而 `construct.go` 的 `init()`（[`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go:26)）是在包加载阶段执行，它目前已经用 `Provide + Invoke` 把 `NotifierWorker` 触发自启动（[`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go:39)）。

因此，如果 runner 也用同样模式：

- **启动时机**：进程启动、包 init/DI wiring 阶段（在 HTTP listen 之前或同时）。
- **端口**：完全不需要。runner 不是 server，它不 listen；它只读写 DB、再调用 [`EventManager.Dispatch()`](backend/internal/events/manager.go:66) 入队。
- **与 API 的关系**：同一个进程里“HTTP server + runner goroutine”并存。HTTP 用统一端口（例如 8080），runner 不占端口。

你担心“runner 不随 api 启动会不会变成独立服务”——按这个方案不会。它仍然是同一进程的后台 goroutine。

> 需要额外强调的治理点：如果未来你们想把 runner 单独做成 worker 进程（例如新命令 `novel-man worker`），那么把启动写在 `construct.go` 会导致它在所有命令都启动。届时要做的是“加 enable 开关或迁移启动点到 api.go 的生命周期里”，而不是让 runner 监听一个新端口。

---

## 四、为什么投递选择 `EventManager.Dispatch`，而不是 runner 直接 `scheduler.Enqueue`

这其实是一个“耦合度”选择。

- 你们的事件管道是：`EventManager.Dispatch → 生成 QueueTask → QueueScheduler.Enqueue → 按 module consumer 消费`（见 [`backend/internal/events/manager.go`](backend/internal/events/manager.go:66) 和 [`backend/internal/events/scheduler.go`](backend/internal/events/scheduler.go:63)）。
- works module 已经注册 consumer：[`backend/internal/apps/works/module.go`](backend/internal/apps/works/module.go:45)。

如果 runner 直接调用 `QueueScheduler.Enqueue`：

- 需要把 works consumer 函数引用也拿过来传给 Enqueue（scheduler 的签名要求 consumer），这会让 ops runner **直接依赖 works 模块 wiring 细节**。

而走 `EventManager.Dispatch`：

- runner 只依赖事件契约（eventType + payload），routes 由 works module 管。
- 未来 works 的 consumer/路由变化，runner 不需要跟着重接线。

所以我们选 Dispatch，本质是为了“让 ops runner 与 works consumer 之间只通过事件契约耦合”。

---

## 五、幂等与可追踪：字段为什么这么填

这里完全是“按现有实现对齐”。

### 1）幂等靠什么？

scheduler 的去重键是 `event_id + module`：

- `BuildDedupKey(eventID, module)` 在 [`backend/internal/events/manager.go`](backend/internal/events/manager.go:113)
- 具体去重在 [`backend/internal/events/scheduler.go`](backend/internal/events/scheduler.go:63)

所以 runner 必须构造一个稳定的 `EventID`，让同一 job 的同一 work 重复投递会被 dedup。

推荐形态：`opsjob:{job_id}:work:{work_id}:recalc_stats:v1`。

### 2）works consumer 怎么拿到 work_id？

[`WorkService.HandleWorkStatsTask()`](backend/internal/services/works/work_service.go:68) 通过 [`parseWorkIDFromTask()`](backend/internal/services/works/work_service.go:120) 优先读取 `payload.work_id`，因此 runner payload 至少要包含 `{"work_id": <id>}`。

这也是为什么我们强调“payload 里要带 work_id”，别依赖 partition_key 兜底。

---

## 六、你最关心的：周期性扫描会不会风暴？如何退让业务？必须可配置吗？

答案是：**有风暴风险**，并且必须用多层机制压住；周期/批大小/续租/flush/退避都应该配置化。

这里把控制手段按“从外到内”的顺序讲清楚：

### 1）runner 自己的节奏（scanInterval + limit）

runner 不应该 while(true) 紧循环扫描；必须 ticker，并且：

- 扫描周期可配置（你提的“不能太频繁”是对的）
- 扫描 query 必须 limit（每 tick 只拉少量 running jobs），避免全表扫
- 多实例时建议加 jitter，避免同一秒钟同时打 DB

这些在详细设计里其实已经给了方向（例如“每 tick 拉取少量 running job limit=K”），见 [`tasks/admin-console-mvp/2.2_design/ops_runner-detailed-design.md`](tasks/admin-console-mvp/2.2_design/ops_runner-detailed-design.md:211)。

### 2）DB 写压力退让（续租与进度 flush 降频）

风暴很多时候不是读，而是写：续租 UPDATE、进度 UPDATE、终态 UPDATE。

因此必须：

- lease TTL / renew interval 可配置，renew 不要太密
- progress 更新做聚合 flush（每 N 条或每 T 秒），不要 1 work 1 update

详细设计里对 TTL/renew/flush 的默认值与理由已有建议（SQLite 写竞争），见 [`ops_runner-detailed-design.md`](tasks/admin-console-mvp/2.2_design/ops_runner-detailed-design.md:362)。

### 3）队列背压：queue full 必须 backoff

`QueueScheduler.Enqueue()` 在队列满会返回 `queue is full`（[`backend/internal/events/scheduler.go`](backend/internal/events/scheduler.go:79)）。runner 看到这个必须退避（sleep/backoff），把它当成系统背压信号。

### 4）最重要的业务退让阀门：works module concurrency

因为 runner 投递的任务 module 是 `works`，消费时的 slot 限制在 scheduler 内按 module 生效（[`backend/internal/events/scheduler.go`](backend/internal/events/scheduler.go:184)）。

这意味着：

- 你可以通过 `events.module_concurrency.works` 把重算吞吐压到很低，优先让业务写入/章节更新更平稳。
- 并发覆盖的应用点在 [`backend/internal/cmd/api.go`](backend/internal/cmd/api.go:57) 调 [`applySchedulerConcurrency()`](backend/internal/cmd/events_runtime.go:26)。

这也是我们坚持“不需要新增 ops module concurrency、不需要改 managedModules”的关键原因：**速度阀门已经在 works**。

---

## 七、推荐的配置项清单 + 默认值范围（MVP 起步建议）

这部分是为了把“避免风暴 / 为业务退让”的讨论落到可执行的配置上。

### 1）runner 自身节奏（决定扫表与入队的基础节拍）

- `opsRunner.enabled`：默认 `true`（需要时可一键关闭）
- `opsRunner.scanIntervalSeconds`：建议默认 `5`（范围 `3~30`）
  - 经验：SQLite/单机环境宁可慢；如有多实例，建议加 jitter（实现里随机 ±10%）。
- `opsRunner.scanJobLimit`：建议默认 `10`（范围 `1~50`）
  - 每 tick 最多处理多少个 running job（避免一轮扫太多造成突发写压力）。

### 2）lease（决定 runner 对 ops_jobs 的写入频率与“抢占/续租稳定性”）

- `opsRunner.leaseTTLSeconds`：建议默认 `60`（范围 `30~120`）
- `opsRunner.renewIntervalSeconds`：建议默认 `20`（范围 `10~60`）
  - 经验：一般取 TTL 的 1/3~1/2。

### 3）works 扫描与 enqueue 节流（决定一次性投递多少 work）

- `opsRunner.workScanBatchSize`：建议默认 `200`（范围 `50~1000`）
  - 每次从 works 表读多少个 id（分页）。
- `opsRunner.enqueueBatchSize`：建议默认 `50`（范围 `10~200`）
  - 每次调用 Dispatch/Enqueue 的数量上限。
- `opsRunner.enqueueBackoffBaseMs`：建议默认 `200`（范围 `100~1000`）
- `opsRunner.enqueueBackoffMaxMs`：建议默认 `2000`（范围 `1000~10000`）
  - 用于处理 `queue is full` 等背压：指数退避 + 上限封顶。

### 4）progress flush（决定进度落盘写频率，直接影响 DB 写竞争）

- `opsRunner.progressFlushEveryN`：建议默认 `10`（范围 `5~100`）
- `opsRunner.progressFlushIntervalMs`：建议默认 `2000`（范围 `1000~10000`）
  - 任一条件满足即 flush。

### 5）真正的“业务退让阀门”：works module concurrency（系统级）

- `events.module_concurrency.works`：默认 `1`（范围 `1~4`，视 DB 能力）
  - 这是最有效的限速手段：因为最终任务 `module=works`，scheduler 会按 module slot 限制并发消费（见 [`backend/internal/events/scheduler.go`](backend/internal/events/scheduler.go:184)）。
  - 优先级：当发现对线上写入有影响时，**先降这个**，再调 runner 自己的 scan/enqueue。

## 最后的落地基线（一句话版）

runner 就是 ops 域的后台 goroutine：放 `backend/internal/services/ops/runner`，用 [`backend/internal/cmd/construct.go`](backend/internal/cmd/construct.go:26) Provide+Invoke 启动；扫描 `ops_jobs` 拿到 work_id 后，通过 [`EventManager.Dispatch()`](backend/internal/events/manager.go:66) 投递到 works consumer（[`backend/internal/apps/works/module.go`](backend/internal/apps/works/module.go:45)）；吞吐用 `events.module_concurrency.works` 做硬阀门，runner 的 scan/renew/flush/backoff 全部配置化以避免风暴。
