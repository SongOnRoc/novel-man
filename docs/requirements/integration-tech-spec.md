# 前后端数据对接技术文档 (最终修订版)

本文档为“网络小说作家作品管理系统”前后端数据对接提供详细的技术实现方案，已根据所有用户反馈进行修订。

## 1. 后端调整

### 1.1. AI助手API实现与配置热加载

为了实现灵活、安全的AI服务调用，我们将扩展现有的热加载配置机制来管理AI配置。

*   **1.1.1. 配置文件扩展**
    *   **文件**: `backend/config.yaml`
    *   **任务**: 在配置文件中增加 `ai` 部分。

    ```yaml
    # ... (server, database, logger configs)

    # AI 服务配置
    ai:
      # 使用的AI服务提供商 (e.g., "openai", "gemini")
      provider: "openai" 
      # API的Base URL
      base_url: "https://api.openai.com/v1"
      # 使用的模型名称
      model: "gpt-4-turbo"
      # API Key (强烈建议通过环境变量覆盖此值)
      api_key: "YOUR_API_KEY_HERE" 
    ```

*   **1.1.2. 配置结构体扩展**
    *   **文件**: `backend/internal/config/config.go`
    *   **任务**: 在 `Config` 结构体中添加 `AIConfig`。

    ```go
    // ...
    type AIConfig struct {
        Provider string `mapstructure:"provider"`
        BaseURL  string `mapstructure:"base_url"`
        Model    string `mapstructure:"model"`
        APIKey   string `mapstructure:"api_key"`
    }

    type Config struct {
        Server   ServerConfig   `mapstructure:"server"`
        Database DatabaseConfig `mapstructure:"database"`
        Log      LogConfig      `mapstructure:"logger"`
        AI       AIConfig       `mapstructure:"ai"` // 新增
    }
    ```

*   **1.1.3. 实现AI服务并支持热加载**
    *   **文件**: `backend/internal/apps/ai/service.go` (建议新建)
    *   **任务**: 创建一个管理AI配置和客户端的`AIService`。

    ```go
    package ai

    import (
        "sync"
        "sync/atomic"
        "novel-man/backend/internal/config"
        // 导入具体的AI SDK, e.g., "github.com/sashabaranov/go-openai"
    )

    var (
        aiServiceInstance *AIService
        initOnce          sync.Once
    )

    type AIService struct {
        config atomic.Value // 使用 atomic.Value 存储 AIConfig
    }

    func GetAIService() *AIService {
        initOnce.Do(func() {
            aiServiceInstance = &AIService{}
            // 存储初始配置
            aiServiceInstance.config.Store(config.Cfg.AI) 
            
            // 注册配置变更回调
            config.RegisterOnConfigChangeCallback(func(cfg *config.Config) {
                // 热更新配置
                aiServiceInstance.config.Store(cfg.AI) 
            })
        })
        return aiServiceInstance
    }

    // 调用AI服务时，从atomic.Value中获取最新配置
    func (s *AIService) GenerateCompletion(prompt string) (string, error) {
        currentConfig := s.config.Load().(config.AIConfig)
        
        // 使用 currentConfig 初始化AI客户端并发起请求
        // client := openai.NewClientWithConfig(openai.ClientConfig{
        //     BaseURL: currentConfig.BaseURL,
        //     APIKey:  currentConfig.APIKey,
        // })
        // ... 调用SDK ...

        return "Generated text", nil
    }
    ```
    *   **修改 `routers.go`**: `handleCompletion` 等处理器将调用 `GetAIService().GenerateCompletion()` 来获取AI生成的内容。

## 2. 前端实现

### 2.1. API请求代理 (BFF模式)

为了完全隐藏后端API地址，我们将采用**Backend for Frontend (BFF)**模式。

*   **创建Next.js API代理路由**: 在 `frontend/src/app/api/proxy/[...path]/route.ts` 创建通用代理。

    ```typescript
    // frontend/src/app/api/proxy/[...path]/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import axios from 'axios';

    const API_BASE_URL = process.env.BACKEND_API_URL || 'http://localhost:8080/api/v1';

    async function handler(req: NextRequest) {
        // ... (代理实现，与上一版相同)
    }

    export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
    ```

### 2.2. 创建API客户端 (面向BFF)

前端的API客户端将请求BFF代理路由。

*   **`frontend/src/lib/api/client.ts`**:

```typescript
// frontend/src/lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/proxy', // 指向Next.js的BFF代理
});

// ... (请求拦截器保持不变)

export default apiClient;
```

### 2.3. 优雅的加载状态UI

在数据请求期间必须提供清晰的视觉反馈。

*   **任务**: 在所有需要等待API响应的页面或组件中，利用 `isLoading` 状态来控制UI显示。当 `isLoading` 为 `true` 时，应显示**骨架屏 (Skeleton Screen)**。

*   **示例: `frontend/src/app/(main)/works/page.tsx`**

```typescript
// frontend/src/app/(main)/works/page.tsx
'use client';

import { useWorks } from '@/hooks/useWorks';
import { WorkCard } from '@/components/common/lookup/WorkCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorksPage() {
  const { works, isLoading } = useWorks();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  // ...
}
```

### 2.4. 状态管理和Hooks改造

*   `AuthContext` 和 `useAuth` 的实现保持不变。
*   所有 `use...` hooks 的改造逻辑保持不变，即从调用 `mock` 数据改为调用 `lib/api` 中的函数。

## 3. 开发步骤 (最终版)

1.  **后端**:
    1.  更新 `config.yaml` 和 `config.go` 以包含AI配置。
    2.  实现 `AIService` 并集成热加载回调。
    3.  在AI路由处理器中调用 `AIService`。
2.  **前端**:
    1.  实现通用的BFF代理路由。
    2.  配置 `apiClient` 指向BFF代理。
    3.  实现`AuthContext`和`SessionProvider`，完成用户认证流程的对接。
    4.  逐个模块改造`use...` hooks和UI页面，**并在每个页面/组件中实现加载状态的UI（骨架屏）**。
    5.  最后对接AI助手功能。