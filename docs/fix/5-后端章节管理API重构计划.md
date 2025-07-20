# 后端章节管理API重构技术实现计划

**版本:** 1.0
**日期:** 2025-07-20
**作者:** 架构师

## 1. 概述

本文档基于 `memory_bank/decisionLog.md` 中 **[章节管理API路由重构]** 的决策，为后端 `chapters` 模块的重构提供详细的技术实现步骤。目标是废弃原有的嵌套路由，采纳新的以资源为中心的扁平化路由方案。

**新路由方案:**
*   `GET /api/v1/chapters?work_id={work_id}`
*   `POST /api/v1/chapters` (请求体中包含 `work_id`)
*   `GET /api/v1/chapters/{id}`
*   `PUT /api/v1/chapters/{id}`
*   `DELETE /api/v1/chapters/{id}`

## 2. 详细实现步骤

### 2.1. 路由注册 (`backend/internal/router/router.go`)

1.  **移除旧路由**: 删除或注释掉在 `worksGroup` 下注册 `chapters` 的旧代码块（约 L51-L56）。
2.  **注册新路由组**: 在 `apiV1` 级别下，添加一个新的路由组用于章节管理。

    ```go
    // backend/internal/router/router.go

    // ...
    import (
        // ...
        "novel-man/backend/internal/apps/chapters" // 确保已导入
        // ...
    )

    // ...
    func InitRouter(dbInstance *gorm.DB) *gin.Engine {
        // ...
        apiV1 := r.Group("/api/v1")
        {
            // ... (其他路由)

            // 注册 chapters 路由
            chaptersGroup := apiV1.Group("/chapters")
            chaptersGroup.Use(middlewares.JWTAuthMiddleware()) // 基础认证
            chaptersGroup.Use(middlewares.ChapterAuthMiddleware(dbInstance)) // 新的章节权限中间件
            chapters.RegisterRoutes(chaptersGroup) // 注意：这里不再传递 dbInstance

            // ... (其他路由)
        }
        return r
    }
    ```

### 2.2. 中间件 (`backend/internal/middlewares/`)

1.  **创建新文件**: 在 `backend/internal/middlewares/` 目录下创建新文件 `chapter_auth.go`。
2.  **设计 `ChapterAuthMiddleware`**: 这是本次重构的核心。该中间件需要智能地处理不同路由的权限验证。

    ```go
    // backend/internal/middlewares/chapter_auth.go
    package middlewares

    import (
        "net/http"
        "novel-man/backend/internal/apps/chapters"
        "novel-man/backend/internal/apps/works"
        "strconv"

        "github.com/gin-gonic/gin"
        "gorm.io/gorm"
    )

    // ChapterAuthMiddleware 验证用户是否有权访问指定的章节资源。
    // 它处理两种情况：
    // 1. 集合操作 (GET /chapters, POST /chapters): 通过 work_id 验证作品所有权。
    // 2. 成员操作 (GET/PUT/DELETE /chapters/{id}): 通过 chapter_id 反查 work_id，再验证作品所有权。
    func ChapterAuthMiddleware(db *gorm.DB) gin.HandlerFunc {
        return func(c *gin.Context) {
            userID, exists := c.Get("userID")
            if !exists {
                c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
                return
            }

            chapterIDStr := c.Param("id") // 对应 /chapters/{id}
            workService := works.NewWorkService(db)

            var workID uint
            var err error

            if chapterIDStr != "" {
                // 成员路由: /chapters/{id}
                chapterID, err := strconv.ParseUint(chapterIDStr, 10, 64)
                if err != nil {
                    c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid chapter ID"})
                    return
                }

                // 通过 chapter_id 获取 work_id
                // 注意：这里需要一个轻量级的查询，可以考虑在 ChapterService 中添加一个新方法
                var chapter chapters.Chapter
                if err := db.Select("work_id").First(&chapter, uint(chapterID)).Error; err != nil {
                    if err == gorm.ErrRecordNotFound {
                        c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
                        return
                    }
                    c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chapter info"})
                    return
                }
                workID = chapter.WorkID
                c.Set("chapterID", uint(chapterID)) // 将解析后的 chapterID 存入上下文

            } else {
                // 集合路由: /chapters
                var tempWorkID uint64
                if c.Request.Method == "GET" {
                    tempWorkID, err = strconv.ParseUint(c.Query("work_id"), 10, 64)
                } else if c.Request.Method == "POST" {
                    // 从请求体中预读 work_id
                    var req struct {
                        WorkID uint `json:"work_id"`
                    }
                    if err := c.ShouldBindJSON(&req); err != nil {
                        c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "Invalid request body: " + err.Error()})
                        return
                    }
                    tempWorkID = uint64(req.WorkID)
                }

                if err != nil || tempWorkID == 0 {
                    c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "work_id is required"})
                    return
                }
                workID = uint(tempWorkID)
            }

            // 统一进行作品所有权验证
            work, err := workService.GetWorkByID(c.Request.Context(), int64(workID), userID.(uint))
            if err != nil {
                if err == gorm.ErrRecordNotFound {
                    c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "You do not have permission to access this resource"})
                    return
                }
                c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify work ownership"})
                return
            }

            // 验证成功，将 work 信息存入上下文供后续使用
            c.Set("work", work)
            c.Set("workID", work.ID) // 存储解析验证后的 workID

            c.Next()
        }
    }
    ```

### 2.3. 服务层 (`backend/internal/apps/chapters/services.go`)

1.  **修改 `CreateChapterRequest`**: 使 `WorkID` 能从 JSON 请求体中绑定。

    ```go
    // backend/internal/apps/chapters/services.go L34
    type CreateChapterRequest struct {
        WorkID    uint   `json:"work_id" binding:"required"` // 修改这里
        Title     string `json:"title" binding:"required"`
        Content   string `json:"content"`
        Order     int    `json:"order"`
        Status    string `json:"status"`
        WordCount int    `json:"word_count"`
    }
    ```

2.  **修改 `CreateChapter` 方法**: 不再依赖外部传入的 `WorkID`，因为它已经包含在 `req` 中。

    ```go
    // backend/internal/apps/chapters/services.go L96
    func (s *ChapterService) CreateChapter(ctx *context.Context, req CreateChapterRequest) (*Chapter, error) {
        // ...
        chapter := Chapter{
            WorkID:    req.WorkID, // 直接从 req 获取
            // ...
        }
        // ...
    }
    ```

3.  **修改 `GetChapterByID` 和其他方法**: 这些方法签名需要调整，因为 `workID` 不再是权限验证的唯一凭据。权限验证已上移至中间件。但为了数据一致性，查询时最好还是带上 `workID`。

    ```go
    // backend/internal/apps/chapters/services.go L120
    // workID 用于确保章节属于正确的作品
    func (s *ChapterService) GetChapterByID(ctx *context.Context, workID, chapterID uint) (*Chapter, error) {
        var chapter Chapter
        // 查询条件保持不变，确保数据隔离
        if err := s.db.Where("id = ? AND work_id = ?", chapterID, workID).First(&chapter).Error; err != nil {
            // ...
        }
        return &chapter, nil
    }
    ```
    *其他方法 (`UpdateChapter`, `DeleteChapter`) 的逻辑类似，继续使用 `workID` 和 `chapterID` 进行精确操作。*

### 2.4. 处理器层 (`backend/internal/apps/chapters/routers.go`)

1.  **修改 `RegisterRoutes`**: 移除对 `dbInstance` 的依赖，因为它已在 `service` 和 `middleware` 中处理。

    ```go
    // backend/internal/apps/chapters/routers.go L24
    func RegisterRoutes(router *gin.RouterGroup) {
        handler := NewChapterHandler()
        router.POST("", handler.createChapter)
        router.GET("", handler.getChapters)
        router.GET("/:id", handler.getChapter)      // 参数名从 :chapter_id 改为 :id
        router.PUT("/:id", handler.updateChapter)   // 参数名从 :chapter_id 改为 :id
        router.DELETE("/:id", handler.deleteChapter) // 参数名从 :chapter_id 改为 :id
    }
    ```

2.  **修改 `createChapter`**: `work_id` 直接从绑定的 `req` 中获取，不再从 `c.MustGet("work")` 获取。

    ```go
    // backend/internal/apps/chapters/routers.go L34
    func (h *ChapterHandler) createChapter(c *gin.Context) {
        var req CreateChapterRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        // work_id 已在 req 中，并且在中间件中已验证过所有权
        // 不再需要下面这行
        // work := c.MustGet("work").(works.Work)
        // req.WorkID = work.ID

        chapter, err := h.service.CreateChapter(context.New(c.Request.Context()), req)
        // ...
    }
    ```

3.  **修改 `getChapters`**: 从查询参数中获取 `work_id`。

    ```go
    // backend/internal/apps/chapters/routers.go L54
    func (h *ChapterHandler) getChapters(c *gin.Context) {
        // workID 已在中间件中验证，并存入 context
        workID, _ := c.Get("workID")

        page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
        limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

        req := ListChaptersRequest{
            WorkID:    int64(workID.(uint)), // 从 context 获取
            // ...
        }
        // ...
    }
    ```

4.  **修改 `getChapter`, `updateChapter`, `deleteChapter`**:
    *   从 URL 参数 `:id` 获取 `chapterID`。
    *   从上下文中获取由中间件注入的 `workID`。

    ```go
    // backend/internal/apps/chapters/routers.go L85 (以 getChapter 为例)
    func (h *ChapterHandler) getChapter(c *gin.Context) {
        // workID 和 chapterID 均由中间件解析和验证
        workID := c.MustGet("workID").(uint)
        chapterID := c.MustGet("chapterID").(uint)

        chapter, err := h.service.GetChapterByID(context.New(c.Request.Context()), workID, chapterID)
        if err != nil {
            if err == gorm.ErrRecordNotFound {
                c.JSON(http.StatusNotFound, gin.H{"error": "Chapter not found"})
                return
            }
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve chapter"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"data": chapter})
    }
    ```
    *`updateChapter` 和 `deleteChapter` 的逻辑类似调整。*

## 3. 总结

此计划通过引入一个核心的 `ChapterAuthMiddleware`，彻底解耦了章节管理功能与原有的嵌套路由结构。新的实现将更加符合 RESTful 设计原则，结构更清晰，也更易于维护和扩展。

【后端】实现章节管理API

## 2025-07-21 13:07 - 任务恢复与最终全局审查

- **日志**:
  - 任务恢复后，经过多次错误的尝试和用户的反复指正，最终对整个`chapters`模块进行了全面的代码审查。
  - **核心发现**: `chapters`模块的现有代码**已经完全符合**`fix/5-后端章节管理API重构计划.md`中定义的**新版扁平化路由方案**。
    - `router/router.go`: 已注册顶级的`/chapters`路由。
    - `middlewares/chapter_auth.go`: 已实现新的权限中间件。
    - `apps/chapters/services.go`: Service层已实现。
    - `apps/chapters/routers.go`: 处理器已对接Service层和新的中间件逻辑。
    - `apps/chapters/models.go`: `Chapter`模型的JSON标签也已正确添加。
- **最终结论**: 【后端】实现章节管理API的重构任务已**完全实现**。所有相关的代码都已符合最新的技术规范。我之前的所有修改尝试都是基于对现状的错误理解，是不必要的。
