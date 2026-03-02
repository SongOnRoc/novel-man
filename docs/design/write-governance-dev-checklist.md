# Write Governance 开发守则与评审清单

本清单用于约束写入治理相关变更，防止“读中写”与派生字段误更新回归。

## 1. 强制开发守则

1. GET/读路径禁止直接写库。
2. 派生字段仅允许通过派生通道更新（`PatchDerived` 或等价能力）。
3. 业务字段与维护字段必须区分写入意图（`BusinessMutation` / `Maintenance`）。
4. 维护通道必须带审计元数据（`intent/source/actor/request_id`）。
5. 派生刷新需满足可重入、幂等、可重试。

## 2. Code Review 清单

- [ ] 是否新增/修改了 GET handler？若是，确认未调用 `Create/Update/Delete/UpdateByUserID/RefreshDerivedStats` 写路径。
- [ ] 是否存在 `Update(entity)` 更新派生字段的路径？若有，必须改为派生 patch。
- [ ] 是否在服务层写入前构建并透传审计元数据。
- [ ] 是否根据字段类型正确路由到业务/派生/维护通道。
- [ ] 是否补充了对应单元或集成测试（路由、幂等重试、跨模块兼容）。

## 3. CI 门禁要求

CI 必须至少覆盖以下门禁：

1. 读路径禁写静态扫描测试：`TestReadPath_NoWriteCallsInGetHandlers`
2. 派生刷新高并发稳定性测试。
3. 草稿发布到作品派生刷新的跨模块集成测试。

对应流水线实现在 [docker-build.yml](../../.github/workflows/docker-build.yml)。
