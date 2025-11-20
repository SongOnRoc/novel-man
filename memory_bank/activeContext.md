# 草稿页面功能审核与优化 - 活动上下文

**最后更新时间:** 2025-12-04T07:06:00Z

## 当前焦点
对草稿页面（Drafts）的卡片和列表功能进行系统性审核，找出潜在问题及UI设计不足，并进行优化。

## 涉及文件
- **页面**:
  - `frontend/src/app/(main)/drafts/page.tsx` (列表页)
  - `frontend/src/app/(main)/drafts/[id]/page.tsx` (详情页)
- **组件**:
  - `frontend/src/features/drafts/components/DraftList.tsx`
  - `frontend/src/features/drafts/components/DraftCard.tsx`
- **逻辑**:
  - `frontend/src/hooks/draft/useDraftService.ts`
- **后端**:
  - `backend/internal/repositories/gorm/generic.go` (通用查询重构)
  - `backend/internal/contracts/generic.go` (查询条件定义)
  - `backend/internal/controllers/drafts/handler.go`
  - `backend/internal/controllers/prompts/handler.go`

## 任务目标
1. **代码审核**: 检查数据加载、状态管理、错误处理等逻辑问题。 (已完成)
2. **UI/UX 评估**: 识别布局、响应式设计、交互反馈等方面的不足。 (已完成)
3. **系统性优化**: 实施代码重构和界面改进。 (已完成)
4. **后端查询重构**: 废弃 `FilterKeyQuery`，引入递归 `Condition` 结构，统一查询逻辑。 (已完成)
5. **Next.js 15 适配**: 修复动态路由参数类型错误。 (已完成)

## 已完成工作
- **UI/UX**: 优化了 `DraftCard` 的视觉层次，修复了 `DropdownMenu` 导致的死锁问题。
- **Hooks**: 修复了 `useDraftService` 中数据转换的 Bug (CamelCase -> SnakeCase)。
- **Backend**: 重构了 `GenericGormRepository`，引入了基于 `Condition` 结构体的链式查询构建器，支持任意复杂的嵌套查询，彻底移除了 Raw SQL 拼接的风险。
- **Controllers**: 迁移 `DraftController` 和 `PromptController` 使用新的查询构建器。
- **Frontend Build**: 修复了 Next.js 15 带来的 `params` Promise 类型问题，前端构建通过。

## 执行策略
由 NexusCore 收集代码上下文，委派 `code-developer` 模式执行具体的分析与优化工作。
