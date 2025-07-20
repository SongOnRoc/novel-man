## 已完成的部分总结

目前我们已经完成了：

1.  **项目初始化与基础设置**: 搭建了后端服务的核心框架。
2.  **用户认证模块 (Auth)**: 实现了用户注册、登录等核心安全功能。
3.  **作品管理模块 (Works)**: 实现了作品的完整 CRUD 操作。
4.  **章节管理模块 (Chapters)**: 实现了在作品下对章节的 CRUD 操作。

## 第 5 步：实现草稿管理模块 (Drafts)

为了提供更灵活的写作流程，我们引入了草稿箱功能。作者可以先创建和编辑草稿，在内容完善后再决定是否将其正式发布为章节。

**核心实现**:
1.  **草稿模型**: 定义了 `Draft` 数据结构，它与 `Work` 关联，但与 `Chapter` 是分离的。
2.  **CRUD API**: 实现了对草稿的完整 CRUD 操作，同样作为作品的子资源，路由为 `/works/{work_id}/drafts/{draft_id}`。
3.  **发布功能**: 创建了一个特殊的 `POST /:draft_id/publish` 接口，用于将一篇草稿转换为一个正式的章节。
4.  **事务处理**: “发布”操作涉及“创建新章节”和“删除旧草稿”两个步骤，我们使用数据库事务来保证这两个操作的原子性，要么都成功，要么都失败。

---

### **创建文件与代码详解**

#### **1. `backend/internal/apps/drafts/models.go`**

**作用**: 定义了草稿的数据模型。

```go
package drafts

import (
	"time"
	"gorm.io/gorm"
)

// Draft represents a draft of a chapter for a work.
type Draft struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Title   string `json:"title"`
	Content string `json:"content"`

	WorkID uint `json:"work_id"`
}
```

**代码详解**:
- `Draft` 结构体: 包含了草稿的基本信息，如标题、内容和所属的作品 ID (`WorkID`)。它的结构与 `Chapter` 相似，但更简单，因为它不包含 `Order`、`Status` 等已发布章节才有的属性。
- `gorm.DeletedAt`: GORM 的软删除支持。当调用 `db.Delete(&draft)` 时，记录不会从数据库中物理删除，而是将 `deleted_at` 字段填充为当前时间。后续的查询会自动排除这些被“软删除”的记录。

---

#### **2. `backend/internal/apps/drafts/routers.go`**

**作用**: 定义了草稿管理的所有 API 路由和核心的“发布”业务逻辑。

```go
package drafts

import (
	"net/http"
	"novel-man/backend/internal/apps/chapters"
	"novel-man/backend/internal/apps/works"
	"time"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes 注册草稿路由
func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	draftsGroup := router.Group("/drafts")
	{
		draftsGroup.POST("", createDraft)
		draftsGroup.GET("", getDrafts)
		draftsGroup.GET("/:draft_id", getDraft)
		draftsGroup.PUT("/:draft_id", updateDraft)
		draftsGroup.DELETE("/:draft_id", deleteDraft)
		// 核心业务逻辑：发布
		draftsGroup.POST("/:draft_id/publish", publishDraft)
	}
}

// createDraft, getDrafts, getDraft, updateDraft, deleteDraft
// 这些函数的逻辑与 chapters 和 works 中的非常相似，
// 都是从 context 获取 work，然后执行标准的数据库操作，
// 并通过 work_id 保证权限。

// publishDraft 将草稿发布为新章节
func publishDraft(c *gin.Context) {
	work := c.MustGet("work").(works.Work)
	db := c.MustGet("db").(*gorm.DB)
	draftID := c.Param("draft_id")

	var draft Draft
	// 查找需要发布的草稿，同样验证所有权
	if err := db.Where("id = ? AND work_id = ?", draftID, work.ID).First(&draft).Error; err != nil {
		// ... 错误处理 ...
		return
	}

	// 使用数据库事务来确保操作的原子性
	err := db.Transaction(func(tx *gorm.DB) error {
		// 1. 根据草稿内容创建一个新的章节
		now := time.Now()
		newChapter := chapters.Chapter{
			WorkID:      draft.WorkID,
			Title:       draft.Title,
			Content:     draft.Content,
			WordCount:   len([]rune(draft.Content)),
			Status:      "已发布",
			PublishedAt: &now,
		}
		if err := tx.Create(&newChapter).Error; err != nil {
			return err // 如果创建章节失败，事务回滚
		}

		// 2. 删除已发布的草稿
		if err := tx.Delete(&draft).Error; err != nil {
			return err // 如果删除草稿失败，事务回滚
		}

		// 事务成功提交
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish draft: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Draft published successfully"})
}
```

**代码详解**:
- **CRUD 操作**: 草稿的增删改查逻辑与之前的模块非常相似，都依赖于 `WorkOwnerMiddleware` 来保证权限安全。
- **发布接口 (`publishDraft`)**: 这是本模块最核心的业务逻辑。
    - **获取草稿**: 首先，像其他接口一样，获取并验证草稿的所有权。
    - **数据库事务 (`db.Transaction`)**: 这是保证数据一致性的关键。`db.Transaction` 会开启一个事务，并执行传入的函数。
        - **创建章节**: 在事务内部，首先根据草稿的内容创建一个新的 `chapters.Chapter` 对象，并将其存入数据库。
        - **删除草稿**: 章节创建成功后，立即删除对应的草稿。
        - **原子性**: 如果这两个操作中的任何一个失败（例如数据库连接中断），`tx.Transaction` 会自动回滚（Rollback）所有已做的更改。这就避免了“章节创建了但草稿没删除”或“草稿删除了但章节没创建成功”这类数据不一致的问题。
    - **返回结果**: 只有当事务成功提交后，才会向前端返回成功的消息。

---

### **执行目的**

此步骤的目标是**为作者提供一个灵活的内容创作和修改流程**。通过草稿模块，我们实现了：
1.  **安全的内容暂存区**: 作者可以随时保存未完成的写作内容，而不用担心它们会以不完整的状态直接展示给读者。
2.  **先写后发的工作流**: 支持“先在草稿箱中完成所有章节，然后一次性按顺序发布”的写作模式。
3.  **可靠的数据操作**: 通过数据库事务，确保了从草稿到正式章节的转换过程是安全和可靠的。