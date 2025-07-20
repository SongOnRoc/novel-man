# 后端架构问题分析报告

## 1. API接口文档

*   **问题确认**: **是**，存在问题。
*   **分析**:
    *   项目**没有**集成任何API文档自动生成工具（如 `swaggo/gin-swagger`）。
    *   项目依赖于一个手动编写的Markdown文件 ([`docs/requirements/api-spec.md`](docs/requirements/api-spec.md)) 作为API文档。这种方式是落后的，因为代码和文档之间缺乏同步机制，极易导致文档过时和不一致。

## 2. 路由层 (`backend/internal/router/router.go`)

*   **问题确认**: **是**，存在耦合问题，但入口尚算清晰。
*   **分析**:
    *   **耦合问题**:
        1.  **数据库实例耦合**: `InitRouter` 函数接收 `*gorm.DB` 实例并将其层层传递给各模块的路由注册函数，导致路由层与数据库访问层耦合。
            *   **代码示例**: `works.RegisterRoutes(worksGroup, dbInstance)`
        2.  **中间件与服务层耦合**: 为 `ChapterAuthMiddleware` 注入了一个 `chapterService` 实例，使得中间件直接依赖于服务层的具体实现。
            *   **代码示例**: `chaptersGroup.Use(middlewares.JWTAuthMiddleware(), middlewares.ChapterAuthMiddleware(dbInstance, chapterService))`
    *   **API入口混乱问题**:
        *   **否认**。API入口的组织方式是按模块划分的，从主路由文件可以清晰地追溯到各个模块的具体路由，结构尚算清晰。
    *   **其他潜在问题**:
        *   **全局上下文传递依赖**: 通过 `c.Set("db", dbInstance)` 将数据库实例放入 `gin.Context` 是一种反模式，它隐藏了依赖关系，使代码更难理解和测试。

## 3. 服务层 (`backend/internal/apps/*/services.go`)

*   **问题确认**: **是**，存在抽象不足、重复代码和扩展性差的问题。
*   **分析**:
    *   **缺乏抽象和重复代码**:
        1.  **权限验证逻辑重复**: 在多个服务函数中，重复出现了验证用户对资源（如 `Work`）所有权的代码。
            *   **代码示例**: 在 `WorkService` 中，多个函数都通过调用 `s.GetWorkByID(...)` 来进行权限检查。
        2.  **CRUD 操作模板化**: 不同模块的Service中包含了大量相似的CRUD数据库操作代码，缺乏统一的抽象（如Repository层）。
    *   **扩展性差**:
        *   由于业务逻辑与GORM操作紧密耦合，添加需要跨多个模型进行事务性操作的新功能时，代码会变得非常复杂和脆弱。

## 4. 数据访问层 (`backend/internal/models/models.go`)

*   **问题确认**: **是**，模型定义基本合理，但存在一个严重的设计缺陷。
*   **分析**:
    *   **模型定义**: 模型定义整体清晰，通过嵌入 `BaseInfo` 等结构体实现了字段复用，是良好的实践。
    *   **模型关系**: 一对多和多对多的关系定义基本清晰。
    *   **严重的设计缺陷**: `EntityRelationship` 模型试图实现一个通用的、多态的关联。
        *   **代码示例**:
            ```go
            type EntityRelationship struct {
                SourceEntityType string `gorm:"size:100;not null"`
                SourceEntityID   uint   `gorm:"not null"`
                TargetEntityType string `gorm:"size:100;not null"`
                TargetEntityID   uint   `gorm:"not null"`
                RelationshipType string `gorm:"size:100;not null"`
            }
            ```
        *   **风险**: 这种设计虽然灵活，但无法利用数据库的外键约束来保证数据完整性，查询复杂且低效，是数据不一致和性能问题的潜在来源。

## 5. 数据库交互

*   **问题确认**: **是**，业务逻辑严重依赖于具体的数据库操作细节。
*   **分析**:
    *   **高度耦合**: 服务层直接依赖 `*gorm.DB`，并在方法内部构建GORM查询、管理事务、处理GORM特定的错误。
        *   **代码示例 (服务层构建查询)**: `query := s.DB.WithContext(ctx).Model(&models.Work{}).Where("user_id = ?", userID)`
        *   **代码示例 (服务层处理事务)**: `tx := s.DB.WithContext(ctx).Begin()`
    *   **后果**: 这种设计违反了依赖倒置原则，使得业务逻辑难以独立于数据库进行单元测试，并且未来更换ORM或数据库技术的成本极高。

## 总结与建议

当前后端架构存在明显的分层不清、耦合度高的问题。虽然采用了分层的文件结构，但各层之间的依赖关系混乱，特别是服务层和数据访问层几乎完全融合在一起。

**核心建议**:

1.  **引入Repository层**: 在服务层和GORM之间增加一个Repository（仓储）层。服务层依赖于Repository接口，而不是GORM的具体实现。Repository负责封装所有数据库操作，将服务层与数据持久化技术解耦。
2.  **引入Unit of Work模式**: 使用工作单元模式来管理事务，确保跨多个Repository的操作能够在同一个事务中完成。
3.  **移除 `EntityRelationship` 模型**: 重新设计实体间的关系，使用具体的关联表而不是通用的多态关联，以保证数据的完整性和查询性能。
4.  **采用依赖注入**: 使用依赖注入容器或手动注入的方式来管理依赖关系，而不是通过 `gin.Context` 传递。
5.  **集成API文档工具**: 集成 `swaggo/gin-swagger` 等工具，通过代码注释自动生成和同步API文档。