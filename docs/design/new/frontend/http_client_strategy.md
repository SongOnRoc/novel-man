# HTTP 请求客户端设计方案 (最终决策版)

## 1. 背景与目标

我们的架构核心是利用 `Orval` 从 OpenAPI 规范自动生成类型安全的 `@tanstack/react-query` 客户端。这些生成的 Hooks 需要一个底层的 HTTP 客户端来实际执行网络请求。本方案旨在评估并最终确定一个统一的、可复用的客户端方案，并解决所有请求都必须面对的两个核心问题：

1.  **统一认证 (Authentication):** 如何为每个需要授权的 API 请求自动附加认证凭证？
2.  **统一错误处理 (Error Handling):** 如何以一致的方式处理网络和业务错误？

## 2. 方案评估对比

我们将详细评估两种主流方案：**方案 A (基于原生 `fetch` 封装)** 和 **方案 B (基于 `axios` 拦截器)**。

| 对比维度 | 方案 A: 基于原生 `fetch` 封装 | 方案 B: 基于 `axios` 拦截器 |
| :--- | :--- | :--- |
| **核心优势** | 轻量、无额外依赖、与 Next.js 生态结合更紧密。 | 功能强大、拦截器机制成熟、生态完善、久经考验。 |
| **核心劣势** | 全局逻辑（如错误处理）需手动在封装函数中实现，相对繁琐。 | 存在一个额外的第三方依赖。 |
| **适用场景** | 对包体积要求极致，请求逻辑简单的项目。 | 需要处理复杂全局逻辑（如多重拦截、请求取消、超时）的企业级项目。 |
| **最终结论** | **备选方案** | **最终采纳** |

---

## 3. 备选方案: 基于原生 `fetch` 封装 (`customFetcher`)

此方案通过封装浏览器原生的 `fetch` API 来实现一个自定义的请求函数。

### 3.1. 实现代码

```typescript
// 文件路径: /src/lib/api/fetcher.ts (如果采用此方案)

import { getSession } from 'next-auth/react';

export async function customFetcher<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. 获取会话信息
  const session = await getSession();
  const token = session?.accessToken;

  // 2. 注入认证头
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 3. 执行请求 (注意：Next.js 会对 fetch 进行缓存优化)
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 4. 手动进行统一错误处理
  if (!response.ok) {
    const errorInfo = await response.json().catch(() => ({ message: 'Invalid JSON response' }));
    throw new Error(
      `Request failed with status ${response.status}`, 
      { cause: errorInfo }
    );
  }
  
  // 5. 手动解析 JSON 数据
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
      return null as T;
  }

  return response.json();
}
```

### 3.2. 优缺点分析
-   **优点:** 轻量、现代，与 Next.js 生态结合紧密。
-   **缺点:** 错误处理、超时控制等逻辑需要手动实现，不如拦截器机制直观和强大。

---

## 4. 最终采纳方案: 基于 `axios` 拦截器

此方案利用 `axios` 成熟的拦截器机制来构建全局请求处理逻辑。

### 4.1. 实现代码

```typescript
// 文件路径: /src/lib/axios.ts (最终采纳)

import axios, { AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const axiosInstance = axios.create({
  baseURL: '/api/proxy', 
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器: 统一注入认证 Token
axiosInstance.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器: 统一处理全局错误
axiosInstance.interceptors.response.use(
  (response) => response, // 成功响应直接返回
  (error: AxiosError) => {
    if (error.response) {
      const { status } = error.response;
      switch (status) {
        case 401:
          // 例如: Token 过期，触发登出并重定向
          // signOut({ callbackUrl: '/login' });
          console.error('Unauthorized (401): Redirecting to login.');
          break;
        case 500:
        case 502:
        case 503:
          // 例如: 触发全局错误通知
          console.error(`Server Error: ${status}`);
          break;
        default:
          // 其他错误
          console.error(`Unhandled HTTP Error: ${status}`);
      }
    } else if (error.request) {
      console.error('Network Error: No response received.', error.request);
    } else {
      console.error('Axios Setup Error:', error.message);
    }
    // 将错误继续抛出，以便 React Query 能够捕获
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 4.2. 优缺点分析
-   **优点:** 拦截器机制非常强大和灵活，是处理复杂全局逻辑（认证、刷新token、错误上报、全局通知）的理想场所。代码意图清晰，社区成熟，经得起考验。
-   **缺点:** 引入了 `axios` 这个第三方依赖。

---

## 5. 最终决策与理由

经过对两种方案的实现细节和优缺点的全面评估，我们**最终决定采纳方案 B：基于 `axios` 拦截器**。

**核心理由:** 对于一个需要长期维护、功能复杂的企业级应用而言，`axios` 拦截器提供的**健壮性、可维护性和强大的全局逻辑处理能力**，其价值远超于引入一个额外依赖所带来的微小成本。它能让我们以一种非常优雅和集中的方式管理应用的整个请求生命周期。

## 6. 与 `Orval` 的集成

我们将修改 `orval.config.js`，将配置好的 `axiosInstance` 作为所有 `react-query` 客户端的默认请求函数。

```javascript
// orval.config.js 示例
module.exports = {
  // ...
  output: {
    client: 'react-query',
    override: {
      mutator: {
        path: './src/lib/axios.ts', // 指向我们的 axios 实例文件
        name: 'default', // 指定使用文件中的默认导出 (export default)
      },
    },
  },
  // ...
};