## 已完成的部分总结

目前我们已经完成了：

1.  **项目初始化与基础设置**: 搭建了后端服务的核心框架。
2.  **用户认证模块 (Auth)**: 实现了用户注册、登录等核心安全功能。
3.  **作品管理模块 (Works)**: 实现了作品的完整 CRUD 操作。

## 第 4 步：实现章节管理模块 (Chapters)

在用户能够创建作品之后，下一步就是让他们在作品中添加实际内容。此步骤实现了章节的完整 CRUD 功能，并将其与作品紧密地嵌套在一起。

**核心实现**:
1.  **章节模型**: 定义了 `Chapter` 数据结构，包含标题、内容、顺序等，并与 `Work` 模型建立了关联。
2.  **嵌套路由**: 章节的 API 设计为作品的子资源，路由形式为 ` /works/{work_id}/chapters/{chapter_id}`。这种设计非常符合 RESTful 风格，清晰地表达了资源间的层级关系。
3.  **权限继承**: 通过在路由层级上的中间件，章节操作天然地继承了作品的所有权验证。用户只能管理自己作品下的章节。
4.  **高级查询**: 在获取章节列表时，增加了排序功能，允许前端根据不同字段（如顺序、更新时间、字数等）对章节列表进行排序。

---

### **创建文件与代码详解**

#### **1. `backend/internal/apps/chapters/models.go`**

**作用**: 定义了章节的数据模型及其与作品模型的关联。

```go
package chapters

import (
	"novel-man/backend/internal/apps/works"
	"time"
)

// Chapter represents the chapters table in the database.
type Chapter struct {
	ID          uint       `gorm:"primaryKey"`
	WorkID      uint       `gorm:"not null"`
	Work        works.Work `gorm:"foreignKey:WorkID"`
	Title       string     `gorm:"not null;size:255"`
	Content     string     `gorm:"type:text"`
	Order       int        `gorm:"not null"`
	WordCount   int        `gorm:"not null"`
	Status      string     `gorm:"not null;size:50"`
	PublishedAt *time.Time
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// TableName returns the name of the table for the Chapter model.
func (Chapter) TableName() string {
	return "chapters"
}
```

**代码详解**:
- `Chapter` 结构体: 定义了章节的核心属性。`Order` 字段用于控制章节的显示顺序，`WordCount` 用于统计字数，`Status` 用于标记章节状态（如草稿、已发布）。
- `WorkID`: 外键，关联到 `works` 表。
- `Work works.Work \`gorm:"foreignKey:WorkID"\``: 定义了章节与作品的“属于”(Belongs To)关系。一个章节必须属于一个作品。

---

#### **2. `backend/internal/apps/chapters/routers.go`**

**作用**: 定义了章节管理的所有 API 路由和处理逻辑，并巧妙地利用了中间件来处理权限。

```go
package chapters

import (
	// ... imports ...
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes 注册章节路由
// 注意：此函数被设计为在已经添加了 /works/:work_id 前缀的路由组上调用
func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	chaptersGroup := router.Group("/chapters")
	{
		chaptersGroup.POST("", createChapter)
		chaptersGroup.GET("", getChapters)
		chaptersGroup.GET("/:chapter_id", getChapter)
		chaptersGroup.PUT("/:chapter_id", updateChapter)
		chaptersGroup.DELETE("/:chapter_id", deleteChapter)
	}
}

// createChapter 创建新章节
func createChapter(c *gin.Context) {
	// ... 绑定输入数据 ...
    
    // 从中间件获取已验证所有权的 work 对象
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)

	chapter := Chapter{
		WorkID: work.ID, // 自动关联到当前作品
		// ... 填充其他字段 ...
	}

	db.Create(&chapter)
	c.JSON(http.StatusCreated, chapter)
}

// getChapters 获取作品的所有章节
func getChapters(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	// ... 分页和排序逻辑 ...
	query := db.Where("work_id = ?", work.ID)
    // ... 查询并返回列表 ...
}

// getChapter, updateChapter, deleteChapter 的通用逻辑
func getChapterFromContext(c *gin.Context) (*Chapter, error) {
    work := c.MustGet("work").(works.Work)
    db := c.MustGet("db").(*gorm.DB)
    chapterID := c.Param("chapter_id")
    
    var chapter Chapter
    // 查询条件自动包含了 work_id，确保不会越权访问
    if err := db.Where("id = ? AND work_id = ?", chapterID, work.ID).First(&chapter).Error; err != nil {
        return nil, err
    }
    return &chapter, nil
}
```

**代码详解**:
- **嵌套路由与中间件**: 在主路由文件 `router.go` 中，`chapters.RegisterRoutes` 是在一个已经应用了 `WorkOwnerMiddleware` 的路由组上调用的。这个中间件会根据 URL 中的 `:work_id` 查找作品，验证当前登录用户是否是其所有者，如果验证通过，则将该 `work` 对象存入 `gin.Context`。
- **权限的无缝处理**: 在 `chapters/routers.go` 的所有处理函数中，可以直接通过 `c.MustGet("work")` 来获取父资源（作品）的对象。这极大地简化了代码，因为关于“这篇作品是否存在”和“当前用户是否有权操作这篇作品”这两个核心权限问题，已经在中间件层被统一解决了。
- **创建 (`createChapter`)**: 直接从 context 中获取 `work.ID` 作为新章节的 `WorkID`，确保了章节被正确地创建在指定的作品下。
- **查询/更新/删除**: 在这些操作中，查询条件总是 `Where("id = ? AND work_id = ?", chapterID, work.ID)`。这里的 `work.ID` 来自于 context，是经过权限验证的，从而杜绝了任何越权操作的可能性。例如，一个恶意用户无法删除不属于他作品的章节，即使他知道章节的 ID。
- **排序 (`getChapters`)**: 增加了 `sort_by` 和 `sort_order` 查询参数，并设置了白名单 `allowedSortBy` 来防止 SQL 注入，这是一个很好的安全实践。

---

### **执行目的**

此步骤的目标是**允许用户在作品中创建和管理实际的文本内容**。通过实现章节管理，我们提供了：
1.  **内容创作的核心功能**: 用户可以为自己的作品添加、修改和删除章节。
2.  **结构化的内容组织**: 通过 `Order` 字段，用户可以自由地调整章节的顺序。
3.  **清晰的层级关系**: 嵌套的 API 设计和权限模型，确保了数据的一致性和安全性。