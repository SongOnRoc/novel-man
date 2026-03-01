# 步骤 3：前端架构初始化

## 1. 核心价值与目标

本阶段的核心价值在于**将我们在架构蓝图中设计的理论分层模型，首次转化为具体的、可工作的代码实践**。

我们以**认证 (Authentication)** 功能为范例，成功搭建起了支撑整个应用数据流的骨架。此阶段的产出将作为后续所有功能模块开发的**标准模板和最佳实践**。

**核心目标达成:**
- 验证了“UI -> Hooks -> Services -> Generated Client”分层架构的可行性。
- 创建了第一个 `Service` 层模块 (`auth.service.ts`)。
- 创建了第一组 `Hook` 层模块 (`useLoginMutation`, `useRegisterMutation`, `useUserQuery`)。

## 2. 创建与修改的文件清单

-   **`frontend/src/lib/services/auth.service.ts`**: (创建) 封装所有与认证相关的 API 调用。
-   **`frontend/src/hooks/auth/useLoginMutation.ts`**: (创建) 提供了用于处理用户登录的 `useMutation` Hook。
-   **`frontend/src/hooks/auth/useRegisterMutation.ts`**: (创建) 提供了用于处理用户注册的 `useMutation` Hook。
-   **`frontend/src/hooks/auth/useUserQuery.ts`**: (创建) 提供了用于获取当前登录用户信息的 `useQuery` Hook。

## 3. 核心代码逻辑与功能实现

### 3.1 Service 层 (`auth.service.ts`)
`Service` 层的核心职责是作为 `Generated Client` 和 `Hooks` 之间的桥梁，它对自动生成的、粒度较细的 API 调用函数进行封装，向上层提供更具业务语义的接口。

**代码示例:**
```typescript
// frontend/src/lib/services/auth.service.ts

import { getAuth } from '@/lib/api/generated/auth/auth';
import type { components } from '@/types/generated/api';

// 1. 为生成的复杂类型创建更易于使用的别名
type LoginRequest = components['schemas']['auth.LoginRequest'];

// 2. 解构出需要的 API 调用函数
const { postAuthLogin } = getAuth();

// 3. 导出封装后的服务函数
export const loginService = (data: LoginRequest) => {
  return postAuthLogin(data);
};
```

### 3.2 Hooks 层 (`useLoginMutation.ts`)
`Hook` 层的核心职责是使用 `@tanstack/react-query` 来管理异步操作的状态（`loading`, `error`, `success`），并将 `Service` 层的业务逻辑与 UI 组件连接起来。

为了提升 Hooks 的灵活性和可复用性，我们将其设计为可接收 `options` 参数的模式，允许调用方（UI 组件）按需覆盖 `onSuccess`, `onError` 等副作用处理函数。

**代码示例:**
```typescript
// frontend/src/hooks/auth/useLoginMutation.ts
import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { loginService } from '@/lib/services/auth.service';
import type { components, paths } from '@/types/generated/api';

// 1. 从生成的类型中精确推导出 Request, Response, Error 类型
type LoginRequest = components['schemas']['auth.LoginRequest'];
type LoginResponse =
  paths['/auth/login']['post']['responses']['200']['content']['application/json'];
type LoginError =
  paths['/auth/login']['post']['responses']['401']['content']['application/json'];

// 2. 定义 Hook 的 Options 类型
type UseLoginMutationOptions = UseMutationOptions<
  LoginResponse,
  LoginError,
  LoginRequest
>;

// 3. Hook 接收 options 参数并将其透传给 useMutation
export const useLoginMutation = (options?: UseLoginMutationOptions) => {
  return useMutation({
    mutationFn: loginService,
    ...options, // 允许调用方覆盖默认行为
  });
};
```

## 4. 遇到的关键问题与解决方案

| 问题 | 根源分析 | 解决方案 |
| :--- | :--- | :--- |
| **类型与函数导入失败** | 对自动生成代码的命名规则进行了错误的**假设**，导致找不到 `login`, `LoginRequest` 等成员。 | **[解决方案]** 停止假设，直接**查看** `openapi-typescript` 和 `orval` 生成的 `*.ts` 文件，找出其确切的导出名称和结构，然后进行修正。 |
| **类型路径冗长** | `openapi-typescript` 生成的类型路径较长，如 `components['schemas']['auth.LoginRequest']`。 | **[解决方案]** 在 `Service` 或 `Hook` 文件的顶部，使用 `type` 关键字为这些长路径创建简洁的本地**类型别名**，提高代码的可读性。 |