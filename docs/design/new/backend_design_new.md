# 后端技术设计方案 (重构版)

## 1. 概述

本文档描述了 novel-man 项目重构后的后端技术设计方案。新架构遵循**整洁架构 (Clean Architecture)** 和**依赖倒置原则 (DIP)**，通过**接口化**、**依赖注入 (DI)** 和**模块化自动注册**机制，实现了一个高度解耦、可测试、可扩展的系统。

## 2. 技术栈 (核心)

- **编程语言**: Go
- **Web 框架**: Gin
- **ORM 框架**: GORM
- **依赖注入**: Uber's Dig
- **API 文档**: Swaggo
- **配置管理**: Viper
- **命令行接口**: Cobra

## 3. 架构设计

### 3.1 核心理念：依赖倒置

新架构的核心是依赖关系的方向。所有依赖都指向中心的**抽象层 (接口)**，而不是具体实现。

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│  Infrastructure  │   │    Application   │   │      Domain      │
│  (GORM, Gin, ...)│──>│ (Business Logic) │<──│ (Core Entities)  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
         │                      ▲
         └──────────────────────┘
              (Implements Interfaces)
```
*   **Domain (领域层)**: 定义核心业务实体，是系统的中心。
*   **Application (应用层)**: 包含业务逻辑，依赖于 Domain 层和抽象的接口。
*   **Infrastructure (基础设施层)**: 提供具体实现（如数据库操作、Web服务），依赖于应用层定义的接口。

### 3.2 新分层结构与数据流

请求的处理流程严格遵循单向数据流：

**Request -> Controller -> Service (Interface) -> Repository (Interface) -> DB**

1.  **Controller (表现层)**: 接收 HTTP 请求，调用 `Service` 接口。
2.  **Service (业务层)**: 实现业务逻辑，调用 `Repository` 接口。
3.  **Repository (仓储层)**: 封装数据持久化逻辑。
4.  **Contracts (合约层)**: **这是一个逻辑层，物理上存在于 `internal/contracts` 目录**。它定义了 `Service` 和 `Repository` 的接口，是解耦的关键。

### 3.3 新目录结构

```
backend/internal/
├── apps/                  # 模块化自动注册核心
│   ├── works/
│   │   └── module.go      # works模块的注册定义
│   └── registry.go        # 模块注册表
├── container/
│   └── container.go       # 全局DI容器 (dig)
├── contracts/             # 【接口层】
│   ├── works/
│   │   ├── service.go
│   │   └── repository.go
│   └── ...
├── controllers/           # 【表现层】
│   ├── works/
│   │   └── handler.go
│   └── ...
├── repositories/          # 【数据实现层】
│   └── gorm/
│       └── works.go
├── services/              # 【业务实现层】
│   ├── works/
│   │   └── service.go
│   └── ...
├── router/
│   └── router.go          # 路由初始化
└── models/                # 【领域层】
    └── models.go
```

## 4. 核心组件设计 (重构后)

### 4.1 自动化依赖注入与模块注册

这是新架构的引擎，取代了旧架构中手动的、紧耦合的组件初始化方式。

*   **DI 容器**: 使用 `go.uber.org/dig` 作为全局容器，负责在应用启动时自动创建和连接所有组件。
*   **Provider**: 每个组件（Repository, Service, Controller）都提供一个 `New...` 构造函数作为 Provider，并使用 `init()` 函数将其注册到 DI 容器。
*   **自动注册**: 每个业务模块通过 `init()` 将自己注册到 `apps` 注册表中。主程序入口只需通过空白导入 (`_`) "激活"模块，即可完成所有组件的依赖注入和路由的自动注册。

### 4.2 控制器 (Controller)

*   **职责**: 仅负责 HTTP 协议相关的工作（解析请求、验证输入、调用Service、返回响应）。
*   **依赖**: 依赖 `Service` **接口**。

### 4.3 服务 (Service)

*   **职责**: 封装和实现核心业务逻辑。
*   **依赖**: 依赖 `Repository` **接口**。不应包含任何数据库或HTTP相关的代码。

### 4.4 仓储 (Repository)

*   **职责**: 封装数据持久化逻辑。
*   **实现**: `gorm` 包下的 `repository` 实现了在 `contracts` 中定义的接口，将 GORM 的具体操作封装在内。

## 5. API 设计与文档

*   **API 设计**: 保持原有的 RESTful 风格。
*   **API 文档**: 废弃手动维护的 Markdown 文档，全面采用 `swaggo`。
    *   通过在 Controller 的 Handler 方法上添加特定格式的注释，实现 API 文档的自动生成。
    *   通过 `/swagger/index.html` 路由提供可交互的 API 文档页面。

## 6. 测试策略 (重构后)

新架构极大地提升了可测试性。

*   **单元测试**:
    *   **Service 层**: 可以轻松地 Mock `Repository` 接口，从而在不连接数据库的情况下，独立、快速地测试所有业务逻辑。
    *   **Controller 层**: 可以 Mock `Service` 接口，独立测试 HTTP 请求处理、参数绑定和响应格式化。
*   **集成测试**: 保持原有的 E2E 测试策略，验证完整的业务流程。

## 7. 维护和扩展

*   **功能扩展**:
    1.  在 `contracts` 中定义新模块的 `Service` 和 `Repository` 接口。
    2.  在 `repositories`, `services`, `controllers` 中创建对应的实现。
    3.  在 `apps` 中创建新模块的 `module.go`，在 `init()` 中注册所有组件的 Provider。
    4.  在 `cmd/api/main.go` 中添加一行对新模块的空白导入。
    *   **完成。无需修改任何现有代码，新模块即可无缝集成并运行。**