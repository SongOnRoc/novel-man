## 已完成的部分总结

目前我们已经完成了：

1.  **项目初始化与基础设置**: 搭建了后端服务的核心框架。
2.  **用户认证模块 (Auth)**: 实现了用户注册、登录、登出等核心安全功能。

## 第 3 步：实现作品管理模块 (Works)

在用户可以登录系统后，我们为他们提供了核心的功能：创建和管理自己的作品。此步骤实现了对作品的完整 CRUD (创建、读取、更新、删除) 操作。

**核心实现**:
1.  **作品模型**: 定义了 `Work` 数据结构，包含了标题、描述、分类等信息，并与 `User` 模型建立了关联。
2.  **CRUD API**: 创建了 `/works` 路由组，并实现了 `POST`, `GET`, `PUT`, `DELETE` 等 RESTful API 端点。
3.  **权限控制**: 所有作品相关的操作都强制要求用户登录。在处理读取、更新、删除请求时，严格校验了操作者是否为作品的所有者。
4.  **分页与过滤**: 在获取作品列表的接口中，实现了基于参数的分页和按状态过滤的功能。

---

### **创建文件与代码详解**

#### **1. `backend/internal/apps/works/models.go`**

**作用**: 定义了作品的数据模型及其与用户模型的关联。

```go
package works

import (
	"novel-man/backend/internal/apps/auth"
	"time"
)

// Work represents the works table in the database.
type Work struct {
	ID            uint      `gorm:"primaryKey"`
	UserID        uint      `gorm:"not null"`
	User          auth.User `gorm:"foreignKey:UserID"`
	Title         string    `gorm:"not null;size:255"`
	Description   string    `gorm:"type:text"`
	CoverImageURL string    `gorm:"size:255"`
	Category      string    `gorm:"size:100"`
	Status        string    `gorm:"not null;size:50"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// TableName returns the name of the table for the Work model.
func (Work) TableName() string {
	return "works"
}
```

**代码详解**:
- `Work` 结构体: 定义了作品的各个字段，如 `Title`, `Description` 等。
- `UserID`: 这是一个外键字段，用于关联 `users` 表。
- `User auth.User \`gorm:"foreignKey:UserID"\``: 这行代码是 GORM 的精髓之一。它定义了一个“属于”(Belongs To) 的关系，意味着一篇作品属于一个用户。通过这个设置，GORM 可以在查询作品时，方便地预加载（Preload）相关的用户信息。

---

#### **2. `backend/internal/apps/works/routers.go`**

**作用**: 定义了作品管理的所有 API 路由和处理逻辑。

```go
package works

import (
	"net/http"
	"strconv"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.RouterGroup, db *gorm.DB) {
	// 所有 /works 路由都已在主路由中被 AuthRequired 中间件保护
	router.POST("", createWork)
	router.GET("", getWorks)
	router.GET("/:id", getWork)
	router.PUT("/:id", updateWork)
	router.DELETE("/:id", deleteWork)
}

// createWork 创建新作品
func createWork(c *gin.Context) {
	// ... 绑定输入数据 ...
	userID, _ := c.Get("userID") // 从认证中间件获取用户ID
	work := Work{
		UserID: userID.(uint),
        // ... 填充其他字段 ...
	}
	db := c.MustGet("db").(*gorm.DB)
	db.Create(&work)
	c.JSON(http.StatusCreated, work)
}

// getWorks 获取当前用户的所有作品（带分页和过滤）
func getWorks(c *gin.Context) {
	userID, _ := c.Get("userID")
	db := c.MustGet("db").(*gorm.DB)
	var works []Work
	
	// 分页逻辑
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	query := db.Where("user_id = ?", userID)

	// 按状态过滤
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
    
    // ... 查询并返回带分页信息的列表 ...
}

// getWork, updateWork, deleteWork 的通用逻辑
func getWorkByIDAndUserID(c *gin.Context) (*Work, error) {
    userID, _ := c.Get("userID")
    db := c.MustGet("db").(*gorm.DB)
    var work Work
    workID := c.Param("id")

    if err := db.Where("id = ? AND user_id = ?", workID, userID).First(&work).Error; err != nil {
        return nil, err
    }
    return &work, nil
}

// getWork 获取单篇作品
func getWork(c *gin.Context) {
    work, err := getWorkByIDAndUserID(c)
    // ... 错误处理和返回 ...
    c.JSON(http.StatusOK, work)
}

// updateWork 更新作品
func updateWork(c *gin.Context) {
    work, err := getWorkByIDAndUserID(c)
    // ... 错误处理 ...
    // ... 绑定输入并更新 ...
    db.Model(&work).Updates(input)
    c.JSON(http.StatusOK, work)
}

// deleteWork 删除作品
func deleteWork(c *gin.Context) {
    work, err := getWorkByIDAndUserID(c)
    // ... 错误处理 ...
    db.Delete(&work)
    c.Status(http.StatusNoContent)
}
```

**代码详解**:
- **权限验证**: 在每个处理函数中，第一步都是从 `gin.Context` 中获取 `userID`。这个 `userID` 是由前置的 `AuthRequired` 中间件在验证 session 后存入的。这确保了只有登录用户才能执行操作。
- **所有权验证**: 在 `getWork`, `updateWork`, `deleteWork` 这些针对特定作品的操作中，查询条件总是 `Where("id = ? AND user_id = ?", workID, userID)`。这个 `AND user_id = ?` 条件是权限控制的核心，它保证了用户只能操作自己的作品，无法通过修改 URL 中的 `id` 来访问或修改他人的作品。
- **创建 (`createWork`)**: 将获取到的 `userID` 与请求中的作品信息组合成一个新的 `Work` 对象并存入数据库。
- **读取列表 (`getWorks`)**: 实现了分页 (`page`, `limit`) 和按状态 (`status`) 过滤的功能，提高了 API 的灵活性。
- **更新 (`updateWork`)**: 使用 `db.Model(&work).Updates(input)` 来更新作品。GORM 的 `Updates` 方法非常智能，它只会更新 `input` 结构体中非零值的字段，非常适合用于部分更新（PATCH）的场景。
- **删除 (`deleteWork`)**: 执行数据库删除操作，并返回 `204 No Content` 状态码，这是 RESTful API 删除成功的标准实践。

---

### **执行目的**

此步骤的目标是**为用户提供核心的作品管理功能**。这是整个应用内容创作流程的起点。实现这个模块后，用户可以：
1.  创建自己的作品集。
2.  查看和管理自己名下的所有作品。
3.  编辑作品信息，如修改简介、更换封面等。
4.  删除不再需要的作品。