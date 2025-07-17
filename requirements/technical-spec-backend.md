# 网络小说作家作品管理系统 - 后端技术需求文档

## 1. 概述

本文档旨在定义“网络小说作家作品管理系统”后端服务的技术架构和实现规范。后端系统将为前端应用提供所有必要的数据接口和业务逻辑支持。

为了确保系统的高质量、可扩展性和可维护性，我们将参考现有项目 `cdk` 的后端架构。`cdk` 是一个使用 Go 语言构建的、结构清晰、设计精良的系统，其许多设计模式和实践都值得我们借鉴。

## 2. 整体架构

我们将采用基于 Go 语言的分层架构，其核心组件包括：

*   **Web 框架**: Gin (`github.com/gin-gonic/gin`) - 一个高性能的 Go Web 框架，以其出色的性能和丰富的功能集而闻名。
*   **ORM**: GORM (`gorm.io/gorm`) - 一个功能强大且对开发者友好的 Go ORM 库，用于简化数据库操作。
*   **数据库**: 支持 PostgreSQL, MySQL, 和 SQLite。系统通过配置文件动态选择数据库类型，实现了灵活的数据库支持。
*   **缓存**: Redis (`github.com/redis/go-redis/v9`) - 用于会话管理、热点数据缓存和高性能队列等场景。
*   **命令行界面**: Cobra (`github.com/spf13/cobra`) - 用于构建强大的命令行应用程序，我们将用它来管理不同的服务进程（如 API 服务、后台任务）。

系统将由以下几个可独立运行的服务组成：

1.  **API 服务**: 核心的 Web 服务，处理所有来自前端的 HTTP 请求。
2.  **后台工作器 (Worker)**: (可选，用于后续扩展) 异步执行耗时任务，如发送邮件、数据处理等。
3.  **定时任务调度器 (Scheduler)**: (可选，用于后续扩展) 执行定期的计划任务，如数据清理、生成报告等。

## 3. 核心设计模式与原则

### 3.1. 命令驱动的应用启动

- 应用程序的入口 (`backend/cmd/main.go`) 将调用 `cmd.Execute()`。
- `backend/internal/cmd/` 目录将包含所有命令定义。
- `root.go` 定义根命令，并根据参数（如 `api`, `worker`）分发到相应的子命令。
- 每个服务（`api`, `worker`）都有自己的启动命令文件（`api.go`, `worker.go`）。

### 3.2. 分层路由与模块化设计

- **路由定义 (`backend/internal/router/router.go`)**:
    - 集中定义所有 API 路由。
    - 使用 `r.Group()` 对 API 进行分组（如 `/api/v1`），实现版本控制和统一前缀。
    - 按业务模块（`works`, `chapters`, `characters` 等）组织路由，并委托给各模块的处理函数。
- **模块化 (`backend/internal/apps/`)**:
    - 每个核心业务功能（如作品管理、章节管理）都将是一个独立的模块，位于 `backend/internal/apps/` 目录下。
    - 每个模块内部将包含 `models.go`, `routers.go`, `middlewares.go`, `constants.go` 等文件，实现高度内聚。

### 3.3. 模型与数据访问

- **模型定义 (`backend/internal/apps/*/models.go`)**:
    - 使用 GORM struct tags 定义数据库表结构。
    - 模型 struct 不仅包含数据字段，还应包含与该模型相关的核心业务逻辑方法（例如 `work.Publish()`, `chapter.CanAccess()`）。这使得业务逻辑与数据紧密关联，易于维护。
- **数据库事务**:
    - 所有涉及多个写操作的业务逻辑都必须在数据库事务中执行，以保证数据的一致性。

### 3.4. 中间件

- **通用中间件 (`backend/internal/router/middlewares.go`)**:
    - `LoggerMiddleware`: 记录详细的请求日志，包括延迟、状态码等。
    - `RecoveryMiddleware`: 捕获 panic，防止服务器崩溃。
    - `SessionMiddleware`: 使用 Redis 提供会话支持。
    - `AuthMiddleware`: 验证用户登录状态。
- **模块级中间件 (`backend/internal/apps/*/middlewares.go`)**:
    - 用于处理特定模块的权限检查，例如检查用户是否有权限编辑某部作品。

## 4. 目录结构

所有后端代码将统一存放于 `backend/` 目录中。

```
.
├── backend/
│   ├── cmd/
│   │   └── main.go
│   ├── internal/
│   │   ├── apps/
│   │   │   ├── auth/         # 用户认证模块
│   │   │   ├── works/        # 作品管理模块
│   │   │   ├── chapters/     # 章节管理模块
│   │   │   └── ...           # 其他业务模块
│   │   ├── cmd/              # Cobra 命令定义
│   │   │   ├── root.go
│   │   │   ├── api.go
│   │   │   └── ...
│   │   ├── config/           # 配置加载
│   │   ├── db/               # 数据库连接和迁移
│   │   ├── logger/           # 日志记录器
│   │   └── router/           # 路由定义和通用中间件
│   ├── go.mod
│   └── ...
├── frontend/
└── ...
```

## 5. 下一步计划

1.  **初始化项目**: 在 `backend/` 目录下创建 `go.mod`，并建立上述目录结构。
2.  **实现配置加载**: 从 YAML 文件或环境变量中加载配置。
3.  **实现数据库连接和迁移**: 设置 GORM 并创建初始的数据库迁移脚本。
4.  **实现用户认证模块**: 作为所有其他功能的基础。
5.  **逐个实现核心业务模块**: 从“作品管理”开始，然后是“章节管理”等。
