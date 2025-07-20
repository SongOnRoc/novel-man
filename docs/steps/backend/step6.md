## 已完成的部分总结

目前我们已经完成了：

1.  **项目初始化与基础设置**: 搭建了后端服务的核心框架。
2.  **用户认证模块 (Auth)**: 实现了用户注册、登录等核心安全功能。
3.  **作品管理模块 (Works)**: 实现了作品的完整 CRUD 操作。
4.  **章节管理模块 (Chapters)**: 实现了在作品下对章节的 CRUD 操作。
5.  **草稿管理模块 (Drafts)**: 提供了草稿箱和发布为章节的功能。

## 第 6 步：实现角色管理模块 (Characters)

除了主体内容，小说创作还需要管理大量的辅助设定，其中最重要的就是角色。此步骤为作者提供了一个独立于任何具体作品的角色库。

**核心实现**:
1.  **角色模型**: 定义了 `Character` 数据结构，包含了姓名、别名、外貌、性格、能力、背景故事等详细字段。
2.  **用户关联**: 角色直接与 `User` 关联，而不是与 `Work` 关联。这意味着一个作者创建的角色库是通用的，可以在他的多部作品中被引用。
3.  **CRUD API**: 实现了对角色的完整 CRUD 操作，路由为 `/characters`。
4.  **权限控制**: 所有角色操作都与用户 ID 绑定，确保作者只能管理自己的角色库。

---

### **创建文件与代码详解**

#### **1. `backend/internal/apps/characters/models.go`**

**作用**: 定义了角色的数据模型，提供了丰富的字段来结构化地存储角色信息。

```go
package characters

import (
	"time"
	"novel-man/backend/internal/apps/auth"
)

// Character represents the character model.
type Character struct {
	ID              uint      `gorm:"primarykey"`
	UserID          uint      `gorm:"not null"`
	User            auth.User `gorm:"foreignKey:UserID"`
	Name            string    `gorm:"type:varchar(255);not null"`
	Alias           string    `gorm:"type:varchar(255)"`
	AvatarURL       string    `gorm:"type:varchar(255)"`
	AppearanceDesc  string    `gorm:"type:text"`
	PersonalityDesc string    `gorm:"type:text"`
	AbilityDesc     string    `gorm:"type:text"`
	BackgroundStory string    `gorm:"type:text"`
	CreatedAt       time.Time `gorm:"autoCreateTime"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime"`
}

// TableName returns the table name for the Character model.
func (Character) TableName() string {
	return "characters"
}
```

**代码详解**:
- `Character` 结构体: 提供了非常详细的字段来描述一个角色，例如 `AppearanceDesc` (外貌描述), `PersonalityDesc` (性格描述), `AbilityDesc` (能力描述), 和 `BackgroundStory` (背景故事)。这种结构化的数据存储方式远优于将所有信息混在一个大的文本块中。
- `UserID`: 外键，将角色直接与用户绑定。这体现了一个设计决策：角色是属于作者的，而不是属于某一部特定的小说。

---

#### **2. `backend/internal/apps/characters/routers.go`**

**作用**: 定义了角色管理的所有 API 路由和处理逻辑。

```go
package characters

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"novel-man/backend/internal/db"
)

// RegisterRoutes 注册角色路由
func RegisterRoutes(r *gin.RouterGroup) {
	r.POST("", createCharacter)
	r.GET("", getCharacters)
	r.GET("/:id", getCharacter)
	r.PUT("/:id", updateCharacter)
	r.DELETE("/:id", deleteCharacter)
}

// createCharacter 创建新角色
func createCharacter(c *gin.Context) {
	// ... 绑定输入数据 ...
	userID := c.MustGet("userID").(uint) // 从认证中间件获取用户ID
	character := Character{
		UserID: userID,
		// ... 填充其他字段 ...
	}
	db.DB.Create(&character)
	c.JSON(http.StatusCreated, character)
}

// getCharacters 获取当前用户的所有角色
func getCharacters(c *gin.Context) {
	userID := c.MustGet("userID").(uint)
	var characters []Character
	db.DB.Where("user_id = ?", userID).Find(&characters)
	c.JSON(http.StatusOK, characters)
}

// getCharacter, updateCharacter, deleteCharacter 的通用逻辑
func getCharacterByIDAndUserID(c *gin.Context) (*Character, error) {
    userID := c.MustGet("userID").(uint)
    characterID := c.Param("id")
    var character Character
    if err := db.DB.Where("id = ? AND user_id = ?", characterID, userID).First(&character).Error; err != nil {
        return nil, err
    }
    return &character, nil
}
```

**代码详解**:
- **独立的资源**: 与章节和草稿不同，角色管理的路由 `/characters` 是一个顶级路由，不嵌套在 `/works` 之下。这与模型设计相符，即角色是独立于作品的。
- **权限控制**: 尽管是顶级路由，但它同样被 `AuthRequired` 中间件保护。在每个处理函数内部，都通过 `c.MustGet("userID")` 获取当前用户，并在数据库查询时使用 `Where("user_id = ?", userID)` 来确保用户只能访问和修改自己的角色数据。
- **CRUD 实现**: 这里的 CRUD 实现遵循了与之前模块相同的模式：
    - `createCharacter`: 关联当前 `userID` 创建新角色。
    - `getCharacters`: 获取当前 `userID` 下的所有角色。
    - `getCharacter`, `updateCharacter`, `deleteCharacter`: 在操作前，都通过 `Where("id = ? AND user_id = ?")` 来查找记录，这一个查询同时完成了“记录是否存在”和“是否有权操作”两个验证。

---

### **执行目的**

此步骤的目标是**为作者提供一个结构化的角色管理工具**。通过这个模块，作者可以：
1.  **建立自己的角色库**: 随时记录灵感，创建和丰富角色设定。
2.  **跨作品复用角色**: 一个精心设计的角色可以方便地在多部小说中出现，而无需重复创建。
3.  **系统化管理设定**: 将角色的各种信息分门别类地存储，便于查找和维护，避免了在大量文档中寻找设定的麻烦。