## 已完成的部分总结

目前我们已经完成了：

1.  **项目初始化与基础设置**: 搭建了后端服务的核心框架，包括配置管理、CLI、数据库集成和基础路由。

## 第 2 步：实现用户认证模块 (Auth)

在拥有了基础框架之后，我们实现了系统的核心安全功能——用户认证。这包括用户的注册、登录、登出以及身份状态的获取。

**核心实现**:
1.  **用户模型**: 定义了 `User` 数据结构，包含用户名、邮箱和加密后的密码。
2.  **密码安全**: 使用 `bcrypt` 库对用户密码进行哈希处理和验证，确保原始密码不被存储。
3.  **API 接口**: 创建了 `/register`, `/login`, `/logout`, `/me` 四个核心 API 端点。
4.  **Session 管理**: 通过 `gin-contrib/sessions` 中间件，在用户登录成功后创建会话，并在后续请求中通过会话来识别用户身份。
5.  **数据库迁移**: 确保 `users` 表能够被 GORM 自动创建。

---

### **创建文件与代码详解**

#### **1. `backend/internal/apps/auth/models.go`**

**作用**: 定义了用户的数据模型和相关的数据库操作逻辑。

```go
package auth

import (
	"time"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User 定义了用户表的 GORM 模型
type User struct {
	ID           uint   `gorm:"primarykey"`
	Username     string `gorm:"type:varchar(255);unique;not null"`
	Email        string `gorm:"type:varchar(255);unique;not null"`
	PasswordHash string `gorm:"type:varchar(255);not null"`
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// HashPassword 使用 bcrypt 对密码进行哈希处理
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

// CheckPasswordHash 验证密码哈希是否与给定的密码匹配
func (u *User) CheckPasswordHash(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

// BeforeSave GORM钩子，在创建用户时自动哈希密码
func (u *User) BeforeSave(tx *gorm.DB) (err error) {
	if u.ID == 0 && u.PasswordHash != "" {
		hashedPassword, err := HashPassword(u.PasswordHash)
		if err != nil {
			return err
		}
		u.PasswordHash = hashedPassword
	}
	return
}
```

**代码详解**:
- `User` 结构体: 使用 GORM 的标签定义了数据库中的 `users` 表结构，并设置了 `username` 和 `email` 的唯一约束。
- `HashPassword`: 一个辅助函数，用于生成密码的 `bcrypt` 哈希值。`14` 是哈希的成本因子，数值越高越安全但计算越慢。
- `CheckPasswordHash`: `User` 模型的方法，用于比较输入的明文密码和数据库中存储的哈希值是否匹配。
- `BeforeSave`: 这是一个 GORM 钩子。当调用 `db.Create(&user)` 时，GORM 会自动执行此方法。我们在这里实现了密码的自动哈希，这样业务逻辑代码就不需要关心哈希过程了，只需传递明文密码即可。

---

#### **2. `backend/internal/apps/auth/routers.go`**

**作用**: 定义了所有与用户认证相关的 HTTP 路由和处理函数。

```go
package auth

import (
	"net/http"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterPublicRoutes 注册公开路由 (无需认证)
func RegisterPublicRoutes(r *gin.RouterGroup, gormDB *gorm.DB) {
	r.POST("/register", registerHandler(gormDB))
	r.POST("/login", loginHandler(gormDB))
	r.POST("/logout", logoutHandler)
}

// RegisterPrivateRoutes 注册私有路由 (需要认证)
func RegisterPrivateRoutes(r *gin.RouterGroup, gormDB *gorm.DB) {
	r.GET("/me", meHandler(gormDB))
}

// registerHandler 处理用户注册
func registerHandler(gormDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
        // ... 绑定请求数据 ...
		// ... 检查用户是否存在 ...
		user := User{
			Username:     req.Username,
			Email:        req.Email,
			PasswordHash: req.Password, // 密码原文，由 BeforeSave 钩子处理
		}
		gormDB.Create(&user)
        // ... 返回响应 ...
	}
}

// loginHandler 处理用户登录
func loginHandler(gormDB *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
        // ... 绑定请求数据 ...
		var user User
		gormDB.Where("email = ?", req.Email).First(&user)
        // ... 检查用户是否存在和密码是否正确 ...
		if !user.CheckPasswordHash(req.Password) {
			// ... 返回错误 ...
		}
		// 登录成功，设置 session
		session := sessions.Default(c)
		session.Set("userID", user.ID)
		session.Save()
        // ... 返回成功响应 ...
	}
}

// logoutHandler 处理用户登出
func logoutHandler(c *gin.Context) {
	session := sessions.Default(c)
	session.Clear()
	session.Options(sessions.Options{MaxAge: -1}) // 立即销毁
	session.Save()
	c.JSON(http.StatusOK, gin.H{"message": "Successfully logged out"})
}

// meHandler 获取当前用户信息
func meHandler(gormDB *gorm.DB) gin.HandlerFunc {
    // ... 从 context 获取 userID ...
    // ... 查询数据库 ...
    // ... 返回用户信息 ...
}
```

**代码详解**:
- **路由分离**: `RegisterPublicRoutes` 和 `RegisterPrivateRoutes` 将需要认证和无需认证的接口清晰地分离开来，便于在主路由文件中应用中间件。
- `registerHandler`: 接收注册信息，检查用户名和邮箱是否重复，然后创建新用户。
- `loginHandler`: 验证用户凭据。成功后，通过 `session.Set("userID", user.ID)` 将用户 ID 存入会话。服务器会通过 Set-Cookie 响应头将一个加密的 session ID 返回给客户端。
- `logoutHandler`: 清除会话信息，并通过设置 `MaxAge: -1` 让客户端的 cookie 失效。
- `meHandler`: 这是一个需要登录才能访问的接口。它从会话中获取 `userID`，然后查询并返回当前用户的基本信息。

---

#### **3. `backend/internal/db/migration.go`**

**作用**: 提供一个统一的数据库迁移函数。

```go
package db

import (
	"log"
	"gorm.io/gorm"
)

// Migrate 函数执行数据库迁移
func Migrate(db *gorm.DB, models ...interface{}) {
	log.Println("Running database migrations...")
	err := db.AutoMigrate(models...)
	if err != nil {
		log.Fatalf("Could not migrate database: %v", err)
	}
	log.Println("Database migration completed successfully.")
}
```

**代码详解**:
- `Migrate` 函数接收一个 GORM 数据库实例和一系列模型作为参数。
- `db.AutoMigrate(models...)` 是 GORM 的核心功能之一。它会检查传入的每个模型，如果数据库中不存在对应的表，就会创建它；如果表已存在但结构有差异（例如增加了字段），GORM 会尝试修改表结构以匹配模型。
- 在 `root.go` 的 `PersistentPreRun` 中调用 `db.Migrate(dbInstance, &auth.User{}, ...)`，确保了每次应用启动时，`users` 表都存在且结构正确。

---

### **执行目的**

此步骤的目标是**为系统提供核心的安全基础**。通过实现用户认证，我们能够：
1.  **保护用户数据**: 确保只有用户本人才能访问和修改自己的信息。
2.  **保护私有接口**: 为需要登录才能访问的 API（如创建作品、发表章节等）提供了一道安全屏障。
3.  **建立用户身份**: 为后续所有与特定用户关联的功能（如作品管理、设置等）提供了身份识别的基础。