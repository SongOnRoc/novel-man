## 已完成的部分总结

目前我们已经完成了：

1.  **项目初始化与基础设置**: 搭建了后端服务的核心框架。
2.  **用户认证模块 (Auth)**: 实现了用户注册、登录等核心安全功能。
3.  **作品管理模块 (Works)**: 实现了作品的完整 CRUD 操作。
4.  **章节管理模块 (Chapters)**: 实现了在作品下对章节的 CRUD 操作。
5.  **草稿管理模块 (Drafts)**: 提供了草稿箱和发布为章节的功能。
6.  **角色管理模块 (Characters)**: 提供了独立于作品的角色库功能。
7.  **世界观设定模块 (Worldview)**: 提供了强大的世界观构建工具。

## 第 8 步：实现用户偏好设置模块 (Settings)

为了提升应用的个性化体验，我们实现了用户偏好设置功能。用户可以自定义一些应用行为，如 AI 模型、编辑器主题等。

**核心实现**:
1.  **设置模型**: 定义了 `UserSetting` 数据结构，与 `User` 建立了一对一的关系。
2.  **默认值逻辑**: 在获取设置时，如果用户从未保存过设置，系统会返回一套合理的默认值，而不是返回错误。
3.  **Upsert 操作**: 更新设置时，使用了 GORM 的 `OnConflict` (即 "Upsert"，Update or Insert) 功能。如果用户的设置记录已存在，则更新它；如果不存在，则创建一条新记录。这大大简化了前端的逻辑。
4.  **简洁的 API**: 只提供了两个 API 端点：`GET /settings` 用于获取设置，`PUT /settings` 用于更新设置。

---

### **创建文件与代码详解**

#### **1. `backend/internal/apps/settings/models.go`**

**作用**: 定义了用户偏好设置的数据模型。

```go
package settings

import (
	"time"
	"novel-man/backend/internal/apps/auth"
)

// UserSetting 定义了用户的偏好设置
type UserSetting struct {
	ID                uint      `gorm:"primarykey"`
	UserID            uint      `gorm:"not null;uniqueIndex"`
	User              auth.User `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	AIModel           string    `gorm:"size:255"`
	CustomAPIEndpoint string
	EditorTheme       string    `gorm:"size:100"`
	CreatedAt         time.Time `gorm:"autoCreateTime"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime"`
}

// TableName 指定 UserSetting 模型的表名
func (UserSetting) TableName() string {
	return "user_settings"
}
```

**代码详解**:
- `UserSetting` 结构体: 包含了用户可以自定义的各种设置项。
- `UserID uint \`gorm:"not null;uniqueIndex"\``: 这是实现一对一关系的关键。`uniqueIndex` 确保了 `user_id` 字段在 `user_settings` 表中是唯一的，因此一个用户最多只能有一条设置记录。
- `constraint:OnUpdate:CASCADE,OnDelete:CASCADE`: 这是一个数据库级别的约束，意味着如果 `users` 表中的某个用户被删除或其 ID 被更新，`user_settings` 表中相关的记录也会被自动删除或更新，保证了数据的引用完整性。

---

#### **2. `backend/internal/apps/settings/routers.go`**

**作用**: 定义了获取和更新用户设置的 API 路由和处理逻辑。

```go
package settings

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"novel-man/backend/internal/apps/auth"
	"novel-man/backend/internal/db"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// RegisterRoutes 注册 settings 模块的路由
func RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/settings", getSettingsHandler)
	r.PUT("/settings", upsertSettingsHandler)
}

// getSettingsHandler 获取用户偏好设置
func getSettingsHandler(c *gin.Context) {
	currentUser := c.MustGet("user").(auth.User)
	var userSetting UserSetting
	result := db.DB.Where("user_id = ?", currentUser.ID).First(&userSetting)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// 记录不存在，返回一套硬编码的默认设置
			c.JSON(http.StatusOK, gin.H{
				"ai_model": "default-gpt-3.5",
				// ...
			})
			return
		}
		// ... 其他错误处理 ...
	}
	// 记录存在，返回数据库中的设置
	c.JSON(http.StatusOK, gin.H{
		"ai_model": userSetting.AIModel,
		// ...
	})
}

// upsertSettingsHandler 更新或创建用户偏好设置
func upsertSettingsHandler(c *gin.Context) {
	currentUser := c.MustGet("user").(auth.User)
	// ... 绑定输入数据 ...

	userSetting := UserSetting{
		UserID: currentUser.ID,
		// ... 填充其他字段 ...
	}

	// 使用 OnConflict 执行 Upsert 操作
	result := db.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}}, // 冲突检查的列
		DoUpdates: clause.AssignmentColumns([]string{"ai_model", "custom_api_endpoint", "editor_theme"}), // 冲突时需要更新的列
	}).Create(&userSetting)

	// ... 错误处理和返回 ...
}
```

**代码详解**:
- **默认值逻辑 (`getSettingsHandler`)**: 当 `db.First()` 返回 `gorm.ErrRecordNotFound` 错误时，意味着该用户还没有自己的设置记录。在这种情况下，我们没有返回 404 错误，而是返回了一套预设的默认值。这对于前端非常友好，因为前端无需处理“没有设置”的特殊情况。
- **Upsert 操作 (`upsertSettingsHandler`)**: 这是本模块最核心的技术点。
    - `db.DB.Clauses(clause.OnConflict{...})`: 我们使用了 GORM 的 `clause.OnConflict` 来构建一个 "INSERT ... ON CONFLICT ... DO UPDATE" 的 SQL 语句。
    - `Columns: []clause.Column{{Name: "user_id"}}`: 指定了冲突判断的依据。因为 `user_id` 是唯一索引，所以当尝试插入一个已存在的 `user_id` 时，就会触发冲突。
    - `DoUpdates: clause.AssignmentColumns(...)`: 指定了当冲突发生时，应该更新哪些字段。
    - `.Create(&userSetting)`: 最后调用 `Create` 方法。GORM 会根据 `OnConflict` 子句生成相应的 Upsert SQL 语句。这个单一的操作就同时处理了“首次创建设置”和“更新现有设置”两种场景。

---

### **执行目的**

此步骤的目标是**允许用户自定义应用体验，提升应用的灵活性和个性化程度**。通过这个模块：
1.  **提升用户体验**: 用户可以根据自己的喜好调整应用，例如选择自己习惯的编辑器主题。
2.  **支持高级功能**: 允许用户配置 AI 模型或自定义 API 端点，为未来的高级功能扩展提供了基础。
3.  **简化客户端逻辑**: 通过在后端处理默认值和 Upsert 逻辑，前端在调用设置接口时无需关心记录是否存在，代码更简洁。