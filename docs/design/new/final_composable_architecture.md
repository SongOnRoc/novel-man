# 最终的、分层感知的、基于组合的统一服务架构蓝图

## 目录
1. [概述](#概述)
2. [Contracts (接口) 层设计](#contracts-接口-层设计)
3. [Repositories (仓储) 层设计](#repositories-仓储-层设计)
4. [Services (服务) 层设计](#services-服务-层设计)
5. [Controllers (表现) 层设计](#controllers-表现-层设计)
6. [Apps (模块化) 层设计](#apps-模块化-层设计)
7. [设计哲学阐述](#设计哲学阐述)

## 概述

本文档详细描述了我们后端系统的最终架构设计，该设计遵循严格的分层架构原则，通过接口组合和代码嵌入实现高内聚、低耦合的系统结构。该架构模式与项目中已有的"模块化自注册"模式保持高度一致。

## Contracts (接口) 层设计

### 基础 CRUD 接口定义

在 contracts 层，我们定义了可组合的基础 CRUD 接口：

```go
// GenericCRUD 定义了基础的 CRUD 操作接口
type GenericCRUD[T any, ID comparable] interface {
    Create(ctx context.Context, entity *T) error
    GetByID(ctx context.Context, id ID) (*T, error)
    Update(ctx context.Context, id ID, entity *T) error
    Delete(ctx context.Context, id ID) error
    List(ctx context.Context, page, limit int) ([]T, int64, error)
}
```

### Works 模块特有接口定义

Works 模块除了基础的 CRUD 操作外，还有特有的发布功能：

```go
// WorkPublish 定义了作品发布的接口
type WorkPublish interface {
    Publish(ctx context.Context, id int64) error
}
```

### 组合形成完整的 WorkService 接口

通过组合基础 CRUD 接口和特有的发布接口，我们得到了完整的 WorkService 接口：

```go
// WorkService 通过组合基础 CRUD 接口和发布接口形成
type WorkService interface {
    GenericCRUD[Work, int64]
    WorkPublish
}
```

### Repository 层接口设计

同样，我们为 Repository 层定义类似的接口：

```go
// GenericRepository 定义了基础的仓储操作接口
type GenericRepository[T any, ID comparable] interface {
    Create(ctx context.Context, entity *T) error
    GetByID(ctx context.Context, id ID) (*T, error)
    Update(ctx context.Context, id ID, entity *T) error
    Delete(ctx context.Context, id ID) error
    List(ctx context.Context, page, limit int) ([]T, int64, error)
}

// WorkRepository 通过组合基础仓储接口形成
type WorkRepository interface {
    GenericRepository[Work, int64]
}
```

## Repositories (仓储) 层设计

### 可复用的 GenericRepository 基类实现

在 repositories 层，我们提供一个可复用的基类实现：

```go
// GenericGormRepository 提供了一个通用的 GORM 仓储实现
type GenericGormRepository[T any, ID comparable] struct {
    db *gorm.DB
}

func NewGenericGormRepository[T any, ID comparable](db *gorm.DB) *GenericGormRepository[T, ID] {
    return &GenericGormRepository[T, ID]{db: db}
}

func (r *GenericGormRepository[T, ID]) Create(ctx context.Context, entity *T) error {
    return r.db.WithContext(ctx).Create(entity).Error
}

func (r *GenericGormRepository[T, ID]) GetByID(ctx context.Context, id ID) (*T, error) {
    var entity T
    if err := r.db.WithContext(ctx).First(&entity, id).Error; err != nil {
        return nil, err
    }
    return &entity, nil
}

func (r *GenericGormRepository[T, ID]) Update(ctx context.Context, id ID, entity *T) error {
    return r.db.WithContext(ctx).Model(entity).Where("id = ?", id).Updates(entity).Error
}

func (r *GenericGormRepository[T, ID]) Delete(ctx context.Context, id ID) error {
    var entity T
    return r.db.WithContext(ctx).Where("id = ?", id).Delete(&entity).Error
}

func (r *GenericGormRepository[T, ID]) List(ctx context.Context, page, limit int) ([]T, int64, error) {
    var entities []T
    var total int64
    
    offset := (page - 1) * limit
    
    if err := r.db.WithContext(ctx).Model(new(T)).Count(&total).Error; err != nil {
        return nil, 0, err
    }
    
    if err := r.db.WithContext(ctx).Offset(offset).Limit(limit).Find(&entities).Error; err != nil {
        return nil, 0, err
    }
    
    return entities, total, nil
}
```

### 具体的 workRepository 实现

通过嵌入 GenericGormRepository 来复用代码，并实现自己的特有方法：

```go
// WorkGormRepository 通过嵌入 GenericGormRepository 来复用代码
type WorkGormRepository struct {
    *GenericGormRepository[Work, int64]
    db *gorm.DB
}

func NewWorkGormRepository(db *gorm.DB) *WorkGormRepository {
    return &WorkGormRepository{
        GenericGormRepository: NewGenericGormRepository[Work, int64](db),
        db: db,
    }
}

// 可以在这里添加 Work 特有的仓储方法
// func (r *WorkGormRepository) GetWorksByUserID(ctx context.Context, userID uint, page, limit int) ([]Work, int64, error) {
//     // 实现特有方法
// }
```

## Services (服务) 层设计

### 可复用的 GenericService 基类实现

在 services 层，我们也提供一个可复用的基类实现：

```go
// GenericService 提供了一个通用的服务实现
type GenericService[T any, ID comparable, R GenericRepository[T, ID]] struct {
    repo R
}

func NewGenericService[T any, ID comparable, R GenericRepository[T, ID]](repo R) *GenericService[T, ID, R] {
    return &GenericService[T, ID, R]{repo: repo}
}

func (s *GenericService[T, ID, R]) Create(ctx context.Context, entity *T) error {
    return s.repo.Create(ctx, entity)
}

func (s *GenericService[T, ID, R]) GetByID(ctx context.Context, id ID) (*T, error) {
    return s.repo.GetByID(ctx, id)
}

func (s *GenericService[T, ID, R]) Update(ctx context.Context, id ID, entity *T) error {
    return s.repo.Update(ctx, id, entity)
}

func (s *GenericService[T, ID, R]) Delete(ctx context.Context, id ID) error {
    return s.repo.Delete(ctx, id)
}

func (s *GenericService[T, ID, R]) List(ctx context.Context, page, limit int) ([]T, int64, error) {
    return s.repo.List(ctx, page, limit)
}
```

### 具体的 workService 实现

通过嵌入 GenericService 来复用代码，并实现自己的特有方法：

```go
// WorkService 通过嵌入 GenericService 来复用代码
type WorkService struct {
    *GenericService[Work, int64, WorkRepository]
    repo WorkRepository
}

func NewWorkService(repo WorkRepository) *WorkService {
    return &WorkService{
        GenericService: NewGenericService[Work, int64, WorkRepository](repo),
        repo: repo,
    }
}

// 实现 Publish 特有方法
func (s *WorkService) Publish(ctx context.Context, id int64) error {
    // 实现发布逻辑
    work, err := s.GetByID(ctx, id)
    if err != nil {
        return err
    }
    
    // 更新作品状态为已发布
    work.Status = "published"
    return s.Update(ctx, id, work)
}
```

## Controllers (表现) 层设计

Controller 层只依赖于 contracts 层定义的接口，对底层的实现细节完全无感知：

```go
// WorkController 只依赖于 contracts.WorkService 接口
type WorkController struct {
    service contracts.WorkService
}

func NewWorkController(service contracts.WorkService) *WorkController {
    return &WorkController{service: service}
}

func (c *WorkController) CreateWork(ctx *gin.Context) {
    var work models.Work
    if err := ctx.ShouldBindJSON(&work); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    
    if err := c.service.Create(ctx.Request.Context(), &work); err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    ctx.JSON(http.StatusCreated, work)
}

func (c *WorkController) GetWork(ctx *gin.Context) {
    id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
    if err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    work, err := c.service.GetByID(ctx.Request.Context(), id)
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
            return
        }
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    ctx.JSON(http.StatusOK, work)
}

func (c *WorkController) PublishWork(ctx *gin.Context) {
    id, err := strconv.ParseInt(ctx.Param("id"), 10, 64)
    if err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
        return
    }
    
    if err := c.service.Publish(ctx.Request.Context(), id); err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Work not found"})
            return
        }
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    ctx.Status(http.StatusOK)
}
```

## Apps (模块化) 层设计

### works 模块注册

在 apps/works/module.go 中，我们将所有组件注册到 DI 容器：

```go
package works

import (
    "github.com/gin-gonic/gin"
    "novel-man/backend/internal/apps"
    "novel-man/backend/internal/container"
    "novel-man/backend/internal/controllers"
    "novel-man/backend/internal/contracts"
    "novel-man/backend/internal/repositories/gorm"
    "novel-man/backend/internal/services"
)

type worksModule struct{}

func init() {
    apps.Register(&worksModule{})
    
    // 注册仓储实现
    container.Container.Provide(gorm.NewWorkGormRepository)
    
    // 注册服务实现
    container.Container.Provide(services.NewWorkService)
    
    // 注册控制器实现
    container.Container.Provide(controllers.NewWorkController)
}

func (m *worksModule) RegisterRoutes(router *gin.RouterGroup) {
    err := container.Container.Invoke(func(controller *controllers.WorkController) {
        worksGroup := router.Group("/works")
        {
            worksGroup.POST("", controller.CreateWork)
            worksGroup.GET("/:id", controller.GetWork)
            worksGroup.PUT("/:id", controller.UpdateWork)
            worksGroup.DELETE("/:id", controller.DeleteWork)
            worksGroup.POST("/:id/publish", controller.PublishWork)
        }
    })
    if err != nil {
        panic(err)
    }
}
```

### 主程序入口激活模块

在主程序入口 cmd/api.go 中，通过一行空白导入来"激活"整个 Works 模块：

```go
package main

import (
    // ... 其他导入
    
    // 激活各业务模块
    _ "novel-man/backend/internal/apps/auth"
    _ "novel-man/backend/internal/apps/works"  // 激活 Works 模块
    _ "novel-man/backend/internal/apps/chapters"
    // ... 其他模块
)

func main() {
    // ... 应用启动逻辑
}
```

## 设计哲学阐述

这套完整的、贯穿所有分层的架构模式体现了以下几个核心设计哲学：

1. **严格的分层架构**：每一层都有明确的职责，上层只依赖于下层定义的接口，不依赖具体实现。这确保了系统的高内聚、低耦合。

2. **接口组合优于继承**：通过组合小的、功能单一的接口来构建复杂的接口，而不是通过继承。这使得接口更加灵活，易于理解和维护。

3. **代码复用通过嵌入实现**：通过结构体嵌入来复用代码，而不是通过继承。这使得代码复用更加灵活，避免了继承带来的紧耦合问题。

4. **依赖注入实现控制反转**：通过依赖注入容器管理组件的生命周期和依赖关系，实现了控制反转，使得系统更加模块化和可测试。

5. **模块化自注册**：通过空白导入和 init 函数实现模块的自动注册，使得模块的添加和移除更加简单，符合开闭原则。

这套架构模式与项目中已有的"模块化自注册"模式保持高度一致，是对该模式的进一步完善和标准化。它不仅解决了代码复用和模块化的问题，还通过严格的分层和接口定义确保了系统的可维护性和可扩展性。