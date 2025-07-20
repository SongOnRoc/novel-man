# 后端重构最终方案 (v3)

本文档旨在根据现有架构的问题，提出一套完整的、分层递进的重构方案。

---

## 方案一：API 文档自动化

**目标**：解决当前手动维护API文档导致的版本不一致和维护困难问题。

**核心技术**：集成 `swaggo/swag` 与 `swaggo/gin-swagger`。

**实施步骤**：
1.  **安装依赖**: 安装 `swag` CLI 工具及 `gin-swagger` Go模块。
2.  **添加代码注释**: 在 `main` 函数和 API Handlers 添加符合 `swag` 规范的注释。
3.  **生成与集成**: 运行 `swag init` 生成文档，并在路由中添加 `gin-swagger` 中间件来托管UI。

---

## 方案二：分层接口化与依赖注入

**目标**：实现控制层、服务层、数据层的彻底解耦，遵循依赖倒置原则。

### 第1步：数据访问层 (Repository) 接口化
*   **目的**：将数据持久化逻辑（GORM）从业务逻辑中剥离。
*   **动作**：
    1.  为每个模型（如 `Work`）定义 `Repository` **接口**，声明数据操作方法（`Create`, `GetByID`等）。
    2.  创建 `gormRepository` **结构体**来实现该接口，封装所有GORM代码。

### 第2步：服务层 (Service) 接口化
*   **目的**：定义清晰的业务逻辑边界，使其不依赖任何具体的数据实现。
*   **动作**：
    1.  为每个模块定义 `Service` **接口**，声明业务方法（`CreateWork`, `GetWork`等）。
    2.  创建 `service` **结构体**来实现该接口。此结构体将依赖于 `Repository` **接口**，而不是 `gormRepository` 或 `gorm.DB`。

### 第3步：控制层 (Handler) 解耦
*   **目的**：使 Handler 专注于处理 HTTP 请求与响应。
*   **动作**：
    1.  `Handler` 结构体将依赖于 `Service` **接口**。
    2.  所有依赖关系（`gorm.DB` -> `Repository` -> `Service` -> `Handler`）将通过构造函数进行注入。

---

## 方案三：模块化自动注册机制

**目标**：在前两步的基础上，实现模块的“即插即用”，消除在主程序中手动管理模块列表的负担。

**核心思想**：利用Go语言的 `init()` 函数和包导入机制，创建一个中央模块注册表，各个模块在初始化时自动向该注册表“报到”。

### 实施步骤

1.  **创建中央注册表**:
    
    **文件: `backend/internal/apps/registry.go` (新文件)**
    ```go
    package apps

    import (
        "github.com/gin-gonic/gin"
        "gorm.io/gorm"
    )

    // App 定义了模块必须实现的接口
    // RegisterRoutes 方法接收所有必要的依赖
    type App interface {
        Name() string
        RegisterRoutes(router *gin.RouterGroup, db *gorm.DB)
    }

    var registeredApps []App

    // Register 用于模块在 init 时注册自己
    func Register(app App) {
        registeredApps = append(registeredApps, app)
    }

    // GetRegisteredApps 返回所有已注册的模块实例
    func GetRegisteredApps() []App {
        return registeredApps
    }
    ```

2.  **模块实现接口并自我注册**:
    
    **文件: `backend/internal/apps/works/app.go` (新文件)**
    ```go
    package works

    import (
        "novel-man/backend/internal/apps"
        "novel-man/backend/internal/middlewares"
        "github.com/gin-gonic/gin"
        "gorm.io/gorm"
    )

    // 1. 定义一个空的 app 结构体用于实现接口
    type worksApp struct{}

    // 2. 在 init 函数中注册自己
    func init() {
        apps.Register(&worksApp{})
    }
    
    func (a *worksApp) Name() string {
        return "works"
    }

    // 3. 实现 RegisterRoutes 方法，所有依赖注入在此完成
    func (a *worksApp) RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
        // 依赖注入链: gorm.DB -> Repository -> Service -> Handler
        repo := NewGormRepository(db)
        service := NewService(repo)
        handler := NewHandler(service)

        worksGroup := router.Group("/works")
        worksGroup.Use(middlewares.JWTAuthMiddleware())
        {
            worksGroup.POST("", handler.createWork)
            // ... 其他路由
        }
    }
    ```

3.  **改造主路由 (`router.go`)**:
    
    ```go
    package router

    import (
        "novel-man/backend/internal/apps" // 仅需导入注册表包
        "github.com/gin-gonic/gin"
        "gorm.io/gorm"
    )

    func InitRouter(db *gorm.DB) *gin.Engine {
        r := gin.Default()
        apiV1 := r.Group("/api/v1")

        // 从注册表获取所有模块并注册路由
        for _, app := range apps.GetRegisteredApps() {
            app.RegisterRoutes(apiV1, db)
        }

        // ... health check 和 swagger 路由
        return r
    }
    ```

4.  **在主程序入口处“激活”模块**:
    
    **文件: `backend/internal/cmd/api.go` (或 `root.go`)**
    ```go
    package cmd

    import (
        // ... 其他导入
        
        // 使用空白导入来触发各个模块的 init() 函数，完成自动注册
        _ "novel-man/backend/internal/apps/auth"
        _ "novel-man/backend/internal/apps/works"
        _ "novel-man/backend/internal/apps/chapters"
        // ... 将来新增的模块只需在此处添加一行导入
    )

    // ... main function ...
    ```

**最终优势**:
*   **完全解耦**: 主程序与业务模块之间没有任何硬编码依赖。
*   **即插即用**: 启用或禁用一个模块，只需在主程序入口增删一行 `import` 语句，无需修改任何其他逻辑代码。
*   **高度自动化**: 结合了接口化、依赖注入和自动注册，是高度可维护和可扩展的Go项目架构。