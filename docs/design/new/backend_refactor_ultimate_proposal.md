# 后端重构最终方案 v5

本文档为后端架构重构的最终方案，该方案融合了“自动化依赖注入”与“模块化自动注册”两种模式的优点，实现了最大程度的解耦、可维护性和可扩展性，并采纳了所有讨论中的核心要求。

---

## 核心架构原则

1.  **模块自我主权**: 每个业务模块（`works`, `chapters`等）是完全独立的单元。它自己负责定义接口、实现业务、并向系统“宣告”自己的存在和能力。
2.  **接口与实现分离**: 在物理目录结构上严格分离 `contracts` (接口), `repositories` (数据实现), `services` (业务实现), `controllers` (HTTP处理) 各层。
3.  **完全自动化**: 系统启动时，不应手动创建任何`service`或`repository`实例，也不应手动维护任何模块列表。所有组件的实例化和路由注册都通过导入包和`init()`函数自动完成。
4.  **依赖倒置**: 所有依赖关系都指向中心的`contracts`（接口）层，业务逻辑不依赖任何具体实现。

---

## 最终实施方案

### 1. 目录结构

```
backend/internal/
├── apps/                  # 模块化注册核心
│   ├── works/
│   │   └── module.go      # works模块的注册定义
│   ├── chapters/
│   │   └── module.go
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
│       ├── works.go
│       └── ...
├── services/              # 【业务实现层】
│   ├── works/
│   │   └── service.go
│   └── ...
├── router/
│   └── router.go          # 路由初始化
└── ...
```

### 2. 关键代码实现

**A. DI 容器 (`container/container.go`)**
```go
package container
import "go.uber.org/dig"
// C is the global DI container.
var C *dig.Container
func init() { C = dig.New() }
```

**B. 模块注册表 (`apps/registry.go`)**
```go
package apps
import "github.com/gin-gonic/gin"

// Module is the interface that all application modules must implement.
type Module interface {
    RegisterRoutes(router *gin.RouterGroup)
}

var registeredModules []Module

// Register is called by each module's init() function to register itself.
func Register(mod Module) {
    registeredModules = append(registeredModules, mod)
}

// GetRegisteredModules returns all registered modules.
func GetRegisteredModules() []Module {
    return registeredModules
}
```

**C. 模块的自我注册与依赖提供 (以 `works` 模块为例)**

**`apps/works/module.go`**
```go
package works
import (
    "novel-man/backend/internal/apps"
    "novel-man/backend/internal/container"
    works_controller "novel-man/backend/internal/controllers/works"
    gorm_repos "novel-man/backend/internal/repositories/gorm"
    works_service "novel-man/backend/internal/services/works"
    "github.com/gin-gonic/gin"
)

type worksModule struct{}

// init() function is the core of automation.
func init() {
    // 1. Register the module to the application registry.
    apps.Register(&worksModule{})

    // 2. Provide all component constructors of this module to the DI container.
    container.C.Provide(gorm_repos.NewWorkRepository)
    container.C.Provide(works_service.NewService)
    container.C.Provide(works_controller.NewHandler)
}

// RegisterRoutes is called by the main router.
// It uses the DI container to resolve its own handler and register routes.
func (m *worksModule) RegisterRoutes(router *gin.RouterGroup) {
    // Use container.C.Invoke to safely resolve the handler.
    // dig will automatically build the entire dependency chain: Handler -> Service -> Repository -> DB.
    err := container.C.Invoke(func(handler *works_controller.Handler) {
        handler.RegisterRoutes(router)
    })
    if err != nil {
        panic(err) // Fail fast on startup if dependencies can't be resolved.
    }
}
```
*(注: `NewWorkRepository`, `NewService`, `NewHandler` 等构造函数需在各自的文件中定义)*

**D. 主路由 (`router/router.go`)**

路由层完全解耦，不感知任何具体模块的存在。

```go
package router
import (
    "novel-man/backend/internal/apps"
    "github.com/gin-gonic/gin"
)

func InitRouter() *gin.Engine {
    r := gin.Default()
    apiV1 := r.Group("/api/v1")

    // Automatically register routes for all modules found in the registry.
    for _, mod := range apps.GetRegisteredModules() {
        mod.RegisterRoutes(apiV1)
    }

    // ... Other global routes like swagger and health check
    return r
}
```

**E. 主程序入口 (`cmd/api/main.go`)**

入口文件是纯粹的“引导程序”，负责声明和启动，不含任何业务逻辑。

```go
package main
import (
    "novel-man/backend/internal/container"
    "novel-man/backend/internal/db"
    "novel-man/backend/internal/router"
    "gorm.io/gorm"

    // 1. Blank import all modules to trigger their init() functions,
    // which populates both the app registry and the DI container.
    _ "novel-man/backend/internal/apps/works"
    _ "novel-man/backend/internal/apps/chapters"
    // To add a new module, just add a new blank import line here.
)

func main() {
    // 2. Provide base dependencies (like DB connection) to the DI container.
    container.C.Provide(func() *gorm.DB {
        return db.Init()
    })

    // 3. Initialize the router. This will trigger the entire automated
    // registration and dependency injection chain.
    engine := router.InitRouter()

    // 4. Start the server.
    engine.Run(":8080")
}
```

---
### 最终方案总结

此方案是高度自动化、完全解耦的现代Go应用架构。它兼顾了清晰的逻辑分层和极致的开发体验。未来维护和扩展系统将变得异常简单：开发者只需创建符合规范的模块文件，并通过一行 `import` 语句将其“激活”，系统的其他部分无需任何改动。