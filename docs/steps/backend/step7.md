## 已完成的部分总结

目前我们已经完成了：

1.  **项目初始化与基础设置**: 搭建了后端服务的核心框架。
2.  **用户认证模块 (Auth)**: 实现了用户注册、登录等核心安全功能。
3.  **作品管理模块 (Works)**: 实现了作品的完整 CRUD 操作。
4.  **章节管理模块 (Chapters)**: 实现了在作品下对章节的 CRUD 操作。
5.  **草稿管理模块 (Drafts)**: 提供了草稿箱和发布为章节的功能。
6.  **角色管理模块 (Characters)**: 提供了独立于作品的角色库功能。

## 第 7 步：实现世界观设定模块 (Worldview)

为了帮助作者构建和管理宏大的世界观，我们创建了一个专门的模块。这个模块允许作者创建不同的设定分类（如“地理”、“种族”、“历史”），并在每个分类下添加具体的设定条目。

**核心实现**:
1.  **双模型结构**: 创建了两个模型，`WorldviewCategory` (分类) 和 `WorldviewSetting` (设定条目)，它们之间是一对多的关系。
2.  **两级 CRUD**: 分别为分类和设定条目实现了各自的 CRUD API。
3.  **权限与关联验证**: 在创建和更新设定条目时，不仅验证了用户的所有权，还验证了其所属的分类 ID 是否合法且属于该用户。
4.  **数据预加载**: 在查询设定条目时，使用 GORM 的 `Preload("Category")` 功能，将分类信息一并加载，减少了前端的请求次数。

---

### **创建文件与代码详解**

#### **1. `backend/internal/apps/worldview/models.go`**

**作用**: 定义了世界观设定的分类和条目两个核心模型及其关系。

```go
package worldview

import (
	"novel-man/backend/internal/apps/auth"
	"time"
)

// WorldviewCategory 定义了世界观设定的分类
type WorldviewCategory struct {
	ID     uint      `gorm:"primarykey" json:"id"`
	Name   string    `gorm:"type:varchar(255);not null" json:"name"`
	UserID uint      `gorm:"not null" json:"user_id"`
	User   auth.User `gorm:"foreignKey:UserID" json:"user"`
	// ...
}

// WorldviewSetting 定义了世界观设定的 GORM 模型
type WorldviewSetting struct {
	ID          uint              `gorm:"primarykey" json:"id"`
	Name        string            `gorm:"type:varchar(255);not null" json:"name"`
	Description string            `gorm:"type:text" json:"description"`
	CategoryID  uint              `gorm:"not null" json:"category_id"`
	Category    WorldviewCategory `gorm:"foreignKey:CategoryID" json:"category"`
	UserID      uint              `gorm:"not null" json:"user_id"`
	User        auth.User         `gorm:"foreignKey:UserID" json:"user"`
	// ...
}
```

**代码详解**:
- `WorldviewCategory`: 一个简单的模型，用于给设定进行分组。它只包含名称并与用户关联。
- `WorldviewSetting`: 设定条目模型。
    - `CategoryID`: 外键，关联到 `worldview_categories` 表。
    - `Category WorldviewCategory`: 定义了设定条目与分类的“属于”(Belongs To)关系。
    - `UserID`: 这里再次存储了 `UserID`。虽然可以通过 `Category` 间接找到用户，但直接存储可以简化权限查询，使其更高效，无需进行多表连接（JOIN）。

---

#### **2. `backend/internal/apps/worldview/routers.go`**

**作用**: 定义了分类和设定的两套 CRUD 路由和处理逻辑。

```go
package worldview

import (
	// ... imports ...
)

// RegisterRoutes 注册 worldview 模块的路由
func RegisterRoutes(router *gin.RouterGroup) {
	// 分类的 CRUD
	router.POST("/categories", createCategory)
	router.GET("/categories", getCategories)
	router.PUT("/categories/:id", updateCategory)
	router.DELETE("/categories/:id", deleteCategory)

	// 设定条目的 CRUD
	router.POST("/settings", createSetting)
	router.GET("/settings", getSettings)
	router.GET("/settings/:id", getSetting)
	router.PUT("/settings/:id", updateSetting)
	router.DELETE("/settings/:id", deleteSetting)
}

// createSetting 创建设定条目
func createSetting(c *gin.Context) {
	var input WorldviewSetting
	// ... 绑定输入数据 ...

	userID := c.MustGet("userID").(uint)
	input.UserID = userID
	db := c.MustGet("db").(*gorm.DB)

	// 核心验证：检查所选的分类是否存在，并且是否属于当前用户
	var category WorldviewCategory
	if err := db.Where("id = ? AND user_id = ?", input.CategoryID, userID).First(&category).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	db.Create(&input)
	c.JSON(http.StatusCreated, input)
}

// getSettings 获取设定列表
func getSettings(c *gin.Context) {
	// ...
	query := db.Where("user_id = ?", userID)

	// 按分类ID过滤
	if categoryIDStr := c.Query("category_id"); categoryIDStr != "" {
		// ...
		query = query.Where("category_id = ?", categoryID)
	}

	// 预加载分类信息
	if err := query.Preload("Category").Find(&settings).Error; err != nil {
		// ...
	}
	// ...
}

// getSetting 获取单个设定
func getSetting(c *gin.Context) {
    // ...
    // 查询时预加载分类信息
	if err := db.Preload("Category").Where("id = ? AND user_id = ?", id, userID).First(&setting).Error; err != nil {
		// ...
	}
    // ...
}
```

**代码详解**:
- **两套 API**: 在 `/worldview` 路由组下，分别定义了 `/categories` 和 `/settings` 两组独立的 API，用于管理两种不同的资源。
- **关联验证 (`createSetting`)**: 在创建新的设定条目时，代码执行了一个关键的验证步骤：`db.Where("id = ? AND user_id = ?", input.CategoryID, userID).First(&category)`。这个查询确保了用户不能将设定条目创建到一个不存在的，或者不属于自己的分类下面，保证了数据的完整性和安全性。
- **预加载 (`Preload`)**: 在 `getSettings` 和 `getSetting` 函数中，都使用了 `query.Preload("Category")`。当 GORM 执行查询时，它会先查出所有符合条件的 `WorldviewSetting` 记录，然后根据这些记录中的 `CategoryID`，再发起一次查询，将所有相关的 `WorldviewCategory` 一次性查出，并自动填充到每个 `WorldviewSetting` 对象的 `Category` 字段中。这种方式比为每个设定条目都单独查询一次分类要高效得多，避免了 "N+1 查询问题"。

---

### **执行目的**

此步骤的目标是**为作者提供一个强大、结构化的世界观构建工具**。通过这个模块，作者可以：
1.  **系统化地组织设定**: 通过自定义分类（如地理、人物、物品、历史事件等）来管理庞杂的世界观信息。
2.  **方便地记录和查询**: 快速添加新的设定条目，并能按分类进行筛选和查看。
3.  **提升创作效率**: 将分散的设定集中管理，避免在写作过程中反复查找或出现前后矛盾的情况。