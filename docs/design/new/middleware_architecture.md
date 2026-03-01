# 通用中间件架构设计文档

## 概述

本文档描述了一个通用的、可注入的中间件架构设计，该架构能够优雅地处理各种中间件需求（如认证、日志、限流、权限等），并与现有的DI和模块化架构无缝集成。

## 设计目标

1. **通用性**：设计一个统一的中间件接口，适用于所有类型的中间件。
2. **可注入性**：通过依赖注入（DI）容器管理中间件实例。
3. **模块化**：每个业务模块可以轻松获取和使用所需的中间件。
4. **可扩展性**：易于添加新的中间件类型。
5. **自动化注册**：中间件可以自动注册，无需手动逐个处理。

## 核心设计

### 1. 中间件接口定义

在 `backend/internal/contracts/middlewares/middleware.go` 中定义统一的中间件接口：

```go
package middlewares

import (
    "github.com/gin-gonic/gin"
)

// Middleware 定义了通用中间件接口
type Middleware interface {
    // Handler 返回一个 gin.HandlerFunc，用于注册到路由中
    Handler() gin.HandlerFunc
    
    // Name 返回中间件的名称，用于标识和获取中间件
    Name() string
}
```

### 2. DI集成方案

#### 2.1 中间件注册管理器

创建一个中间件注册管理器，类似于路由的管理模式：

```go
// MiddlewareRegistry 中间件注册表，用于管理所有已注册的中间件
type MiddlewareRegistry struct {
    middlewares map[string]Middleware
}

// Register 注册一个中间件
func (r *MiddlewareRegistry) Register(middleware Middleware) {
    if r.middlewares == nil {
        r.middlewares = make(map[string]Middleware)
    }
    r.middlewares[middleware.Name()] = middleware
}

// Get 获取指定名称的中间件
func (r *MiddlewareRegistry) Get(name string) (Middleware, bool) {
    m, ok := r.middlewares[name]
    return m, ok
}

// GetAll 获取所有已注册的中间件
func (r *MiddlewareRegistry) GetAll() map[string]Middleware {
    return r.middlewares
}
```

#### 2.2 中间件自动注册

每个中间件在自己的包中自动注册到注册表中：

```go
// 在中间件实现文件中
func init() {
    // 创建中间件注册表实例（如果不存在）
    registry := GetMiddlewareRegistry()
    
    // 注册中间件
    registry.Register(NewAuthMiddleware())
}
```

#### 2.3 中间件提供者

创建一个中间件提供者，用于在模块中获取中间件：

```go
// MiddlewareProvider 中间件提供者，用于在模块中获取中间件
type MiddlewareProvider struct {
    registry *MiddlewareRegistry
}

// Get 获取指定名称的中间件
func (p *MiddlewareProvider) Get(name string) (Middleware, bool) {
    return p.registry.Get(name)
}

// GetAll 获取所有已注册的中间件
func (p *MiddlewareProvider) GetAll() map[string]Middleware {
    return p.registry.GetAll()
}
```

### 3. 中间件实现

中间件实现应遵循以下模式：

```go
// AuthMiddleware 实现了认证中间件
type AuthMiddleware struct {
    authService auth.AuthService
}

// NewAuthMiddleware 创建一个新的认证中间件实例
func NewAuthMiddleware(authService auth.AuthService) *AuthMiddleware {
    // 注册中间件到注册表
    registry := GetMiddlewareRegistry()
    middleware := &AuthMiddleware{
        authService: authService,
    }
    registry.Register(middleware)
    
    return middleware
}

// Name 返回中间件的名称
func (m *AuthMiddleware) Name() string {
    return "auth"
}

// Handler 返回认证中间件的处理函数
func (m *AuthMiddleware) Handler() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 中间件逻辑实现
        // ...
        c.Next()
    }
}
```

### 4. 模块使用中间件

业务模块可以通过中间件提供者获取所需的中间件实例：

```go
// backend/internal/apps/works/module.go
func (m *worksModule) RegisterRoutes(router *gin.RouterGroup) {
    err := container.Container.Invoke(func(
        controller *works.WorkController,
        middlewareProvider *middlewares.MiddlewareProvider, // 获取中间件提供者
    ) {
        // 公共路由（无需认证）
        publicGroup := router.Group("/works")
        {
            publicGroup.GET("/:id", controller.GetWork)
            publicGroup.GET("", controller.ListWorks)
        }
        
        // 获取认证中间件
        authMiddleware, ok := middlewareProvider.Get("auth")
        if !ok {
            panic("auth middleware not found")
        }
        
        // 需要认证的路由组
        authGroup := router.Group("/works")
        authGroup.Use(authMiddleware.Handler()) // 应用认证中间件
        {
            authGroup.POST("", controller.CreateWork)
            authGroup.PUT("/:id", controller.UpdateWork)
            authGroup.DELETE("/:id", controller.DeleteWork)
            authGroup.POST("/:id/publish", controller.PublishWork)
        }
    })
    
    if err != nil {
        panic(err)
    }
}
```

## 实现示例

### 1. 中间件接口 (`backend/internal/contracts/middlewares/middleware.go`)

```go
package middlewares

import (
    "github.com/gin-gonic/gin"
)

// Middleware 定义了通用中间件接口
type Middleware interface {
    // Handler 返回一个 gin.HandlerFunc，用于注册到路由中
    Handler() gin.HandlerFunc
    
    // Name 返回中间件的名称，用于标识和获取中间件
    Name() string
}
```

### 2. 中间件注册管理 (`backend/internal/middlewares/registry.go`)

```go
package middlewares

import (
    "sync"
)

var (
    registry     *MiddlewareRegistry
    registryOnce sync.Once
)

// MiddlewareRegistry 中间件注册表，用于管理所有已注册的中间件
type MiddlewareRegistry struct {
    middlewares map[string]Middleware
    mutex       sync.RWMutex
}

// GetMiddlewareRegistry 获取全局中间件注册表实例
func GetMiddlewareRegistry() *MiddlewareRegistry {
    registryOnce.Do(func() {
        registry = &MiddlewareRegistry{
            middlewares: make(map[string]Middleware),
        }
    })
    return registry
}

// Register 注册一个中间件
func (r *MiddlewareRegistry) Register(middleware Middleware) {
    r.mutex.Lock()
    defer r.mutex.Unlock()
    
    if r.middlewares == nil {
        r.middlewares = make(map[string]Middleware)
    }
    r.middlewares[middleware.Name()] = middleware
}

// Get 获取指定名称的中间件
func (r *MiddlewareRegistry) Get(name string) (Middleware, bool) {
    r.mutex.RLock()
    defer r.mutex.RUnlock()
    
    m, ok := r.middlewares[name]
    return m, ok
}

// GetAll 获取所有已注册的中间件
func (r *MiddlewareRegistry) GetAll() map[string]Middleware {
    r.mutex.RLock()
    defer r.mutex.RUnlock()
    
    // 返回副本以避免并发问题
    result := make(map[string]Middleware)
    for k, v := range r.middlewares {
        result[k] = v
    }
    return result
}

// MiddlewareProvider 中间件提供者，用于在模块中获取中间件
type MiddlewareProvider struct {
    registry *MiddlewareRegistry
}

// NewMiddlewareProvider 创建一个新的中间件提供者
func NewMiddlewareProvider() *MiddlewareProvider {
    return &MiddlewareProvider{
        registry: GetMiddlewareRegistry(),
    }
}

// Get 获取指定名称的中间件
func (p *MiddlewareProvider) Get(name string) (Middleware, bool) {
    return p.registry.Get(name)
}

// GetAll 获取所有已注册的中间件
func (p *MiddlewareProvider) GetAll() map[string]Middleware {
    return p.registry.GetAll()
}
```

### 3. 中间件模块注册 (`backend/internal/middlewares/module.go`)

```go
package middlewares

import (
    "novel-man/backend/internal/apps"
    "novel-man/backend/internal/container"
    "novel-man/backend/internal/contracts/auth"
    
    "github.com/gin-gonic/gin"
    "go.uber.org/dig"
)

type middlewareModule struct{}

func init() {
    apps.Register(&middlewareModule{})
    
    // 注册中间件提供者
    container.Container.Provide(NewMiddlewareProvider)
    
    // 注册认证服务依赖（用于认证中间件）
    // 注意：认证服务应该在其他地方注册，这里只是为了示例
    // container.Container.Provide(auth_service.NewAuthService)
}

func (m *middlewareModule) RegisterRoutes(router *gin.RouterGroup) {
    // 中间件模块不需要注册路由
}
```

### 4. 认证中间件实现 (`backend/internal/middlewares/auth.go`)

```go
package middlewares

import (
    "net/http"
    "os"
    "strings"
    
    "novel-man/backend/internal/contracts/auth"
    "novel-man/backend/utils/context"
    
    "github.com/gin-gonic/gin"
    "github.com/golang-jwt/jwt/v5"
)

// JWTCustomClaims 定义了JWT的自定义声明
type JWTCustomClaims struct {
    UserID uint `json:"user_id"`
    jwt.RegisteredClaims
}

// AuthMiddleware 实现了认证中间件
type AuthMiddleware struct {
    authService auth.AuthService
    jwtSecret   []byte
}

// NewAuthMiddleware 创建一个新的认证中间件实例
func NewAuthMiddleware(authService auth.AuthService) *AuthMiddleware {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" {
        secret = "your-super-secret-key" // 默认密钥，生产环境应从配置文件或环境变量获取
    }
    
    middleware := &AuthMiddleware{
        authService: authService,
        jwtSecret:   []byte(secret),
    }
    
    // 自动注册到中间件注册表
    registry := GetMiddlewareRegistry()
    registry.Register(middleware)
    
    return middleware
}

// Name 返回中间件的名称
func (m *AuthMiddleware) Name() string {
    return "auth"
}

// Handler 返回认证中间件的处理函数
func (m *AuthMiddleware) Handler() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
            return
        }
        
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
            return
        }
        
        tokenString := parts[1]
        claims := &JWTCustomClaims{}
        
        token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
            return m.jwtSecret, nil
        })
        
        if err != nil {
            if err == jwt.ErrSignatureInvalid {
                c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token signature"})
                return
            }
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: " + err.Error()})
            return
        }
        
        if !token.Valid {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
            return
        }
        
        // 验证用户是否存在
        _, err = m.authService.GetCurrentUser(*context.New(c), claims.UserID)
        if err != nil {
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
            return
        }
        
        // 将 userID 存入 context，以便后续处理函数使用
        c.Set("userID", claims.UserID)
        c.Next()
    }
}
```

### 5. 业务模块使用示例 (`backend/internal/apps/works/module.go`)

```go
package works

import (
    "github.com/gin-gonic/gin"
    "novel-man/backend/internal/apps"
    "novel-man/backend/internal/container"
    "novel-man/backend/internal/controllers/works"
    "novel-man/backend/internal/contracts/middlewares"
    "novel-man/backend/internal/repositories/gorm"
    works_service "novel-man/backend/internal/services/works"
)

type worksModule struct{}

func init() {
    apps.Register(&worksModule{})
    
    // 注册仓储实现
    container.Container.Provide(gorm.NewWorkGormRepository)
    
    // 注册服务实现
    container.Container.Provide(works_service.NewWorkService)
    
    // 注册控制器实现
    container.Container.Provide(works.NewWorkController)
}

func (m *worksModule) RegisterRoutes(router *gin.RouterGroup) {
    err := container.Container.Invoke(func(
        controller *works.WorkController,
        middlewareProvider *middlewares.MiddlewareProvider, // 获取中间件提供者
    ) {
        // 公共路由（无需认证）
        publicGroup := router.Group("/works")
        {
            publicGroup.GET("/:id", controller.GetWork)
            publicGroup.GET("", controller.ListWorks)
        }
        
        // 获取认证中间件
        authMiddleware, ok := middlewareProvider.Get("auth")
        if !ok {
            panic("auth middleware not found")
        }
        
        // 需要认证的路由组
        authGroup := router.Group("/works")
        authGroup.Use(authMiddleware.Handler()) // 应用认证中间件
        {
            authGroup.POST("", controller.CreateWork)
            authGroup.PUT("/:id", controller.UpdateWork)
            authGroup.DELETE("/:id", controller.DeleteWork)
            authGroup.POST("/:id/publish", controller.PublishWork)
        }
    })
    
    if err != nil {
        panic(err)
    }
}
```

## 总结

这个通用中间件架构设计具有以下优势：

1. **统一接口**：所有中间件都实现相同的接口，便于管理和使用。
2. **依赖注入**：通过DI容器管理中间件实例，降低耦合度。
3. **模块化**：每个业务模块可以独立获取和使用所需的中间件。
4. **可扩展性**：易于添加新的中间件类型，不影响现有代码。
5. **自动化注册**：中间件可以自动注册到注册表中，无需手动逐个处理。
6. **灵活获取**：通过中间件提供者，可以按需获取任意中间件。

该设计遵循了项目中已有的"模块化自注册"和"最终的、分层感知的、基于组合的统一服务架构"模式，确保了与现有架构的一致性和兼容性。