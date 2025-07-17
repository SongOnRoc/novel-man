## 已完成的部分总结

目前我们已经完成了所有 MVP 功能模块的开发，包括：

1.  项目初始化与基础设置
2.  用户认证模块 (Auth)
3.  作品管理模块 (Works)
4.  章节管理模块 (Chapters)
5.  草稿管理模块 (Drafts)
6.  角色管理模块 (Characters)
7.  世界观设定模块 (Worldview)
8.  用户偏好设置模块 (Settings)
9.  AI 助手接口 (AI Assistant)

## 第 10 步：统一中间件高级重构

在完成所有核心功能后，我们进行了一次重要的架构重构，以解决代码中的循环依赖问题，并提升系统的可维护性和可扩展性。

**问题背景**:
在重构之前，`middlewares` 包为了实现 `WorkOwnerMiddleware` (作品所有权验证中间件)，需要调用 `works` 包中的函数来查询数据库。同时，`router` 包又需要同时导入 `middlewares` 和 `works`。这种交叉引用在 Go 中是不被允许的，会导致编译错误。

**解决方案：依赖倒置原则 (DIP)**
我们运用了“依赖倒置原则”，核心思想是“高层模块不应依赖于低层模块，两者都应依赖于抽象；抽象不应依赖于细节，细节应依赖于抽象”。

**核心实现**:
1.  **定义接口 (`WorkFinder`)**: 在 `middlewares` 包中，我们定义了一个抽象接口 `WorkFinder`，它只描述了“根据 workID 和 userID 查找作品”这个行为，而不关心具体如何实现。
2.  **中间件依赖接口**: `WorkOwnerMiddleware` 不再依赖任何具体的包，而是依赖于这个抽象的 `WorkFinder` 接口。
3.  **创建服务层 (`WorkService`)**: 在 `works` 包中，我们创建了一个 `WorkService` 结构体，并让它实现了 `WorkFinder` 接口。这个服务封装了数据库查询的逻辑。
4.  **依赖注入 (`Dependency Injection`)**: 在最顶层的 `router` 包中，我们创建 `WorkService` 的实例，并将其作为参数“注入”到 `WorkOwnerMiddleware` 中。

---

### **修改文件与代码详解**

#### **1. `backend/internal/middlewares/auth.go` (定义接口)**

**作用**: 定义抽象接口，解除对具体实现的依赖。

```go
package middlewares

import (
	// ...
)

// 1. 定义一个抽象接口
type WorkFinder interface {
	FindWorkForUser(workID uint, userID uint) (interface{}, error)
}

// ... AuthRequired 中间件 ...

// 2. 中间件依赖于这个抽象接口，而不是任何具体的服务
func WorkOwnerMiddleware(finder WorkFinder) gin.HandlerFunc {
	return func(c *gin.Context) {
		// ... 获取 userID 和 workID ...

		// 3. 通过接口调用方法，完全不知道背后是谁在执行数据库查询
		work, err := finder.FindWorkForUser(uint(workID), userID.(uint))
		if err != nil {
			c.AbortWithStatusJSON(http.StatusNotFound, gin.H{"error": "Work not found or you don't have permission"})
			return
		}

		c.Set("work", work)
		c.Next()
	}
}
```

**代码详解**:
- `WorkFinder` 接口: 这是解耦的关键。`middlewares` 包现在只知道“我需要一个能帮我找到作品的东西”，但它不关心这个东西来自哪里，是 `works` 包还是其他包。
- `WorkOwnerMiddleware(finder WorkFinder)`: 中间件的函数签名发生了改变，它现在接收一个 `WorkFinder` 类型的参数。

---

#### **2. `backend/internal/apps/works/services.go` (实现接口)**

**作用**: 提供接口的具体实现。

```go
package works

import (
	"gorm.io/gorm"
)

// 1. 创建一个服务结构体
type WorkService struct {
	DB *gorm.DB
}

// 2. 让 WorkService 实现 middlewares.WorkFinder 接口
func (s *WorkService) FindWorkForUser(workID uint, userID uint) (interface{}, error) {
	var work Work
	// 封装了具体的数据库查询逻辑
	err := s.DB.Where("id = ? AND user_id = ?", workID, userID).First(&work).Error
	return work, err
}
```

**代码详解**:
- `WorkService`: 这是一个新的服务层结构体，它持有一个数据库连接。
- `FindWorkForUser`: `WorkService` 实现了 `WorkFinder` 接口所要求的方法。这里的代码就是之前散落在中间件或路由处理器中的数据库查询逻辑。

---

#### **3. `backend/internal/router/router.go` (依赖注入)**

**作用**: 在应用顶层将“具体实现”注入到需要它的地方。

```go
package router

import (
	// ...
	"novel-man/backend/internal/apps/works"
	"novel-man/backend/internal/middlewares"
)

func InitRouter(dbInstance *gorm.DB) *gin.Engine {
	// ...

	apiV1 := r.Group("/api/v1")
	{
		// ...
		worksGroup := apiV1.Group("/works")
		worksGroup.Use(middlewares.AuthRequired())
		works.RegisterRoutes(worksGroup, dbInstance)

		// --- 依赖注入发生在这里 ---
		// 1. 创建一个 WorkService 的实例 (具体实现)
		workService := &works.WorkService{DB: dbInstance}

		// 2. 为需要验证作品所有权的路由组创建一个新的子组
		workScopedGroup := worksGroup.Group("/:work_id")

		// 3. 将 workService 实例作为参数，注入到中间件工厂函数中
		workScopedGroup.Use(middlewares.WorkOwnerMiddleware(workService))

		// 4. 在这个被保护的路由组上注册子资源的路由
		chapters.RegisterRoutes(workScopedGroup, dbInstance)
		drafts.RegisterRoutes(workScopedGroup, dbInstance)
		// ...
	}
	return r
}
```

**代码详解**:
- **组装**: `router` 包作为应用的“组装层”，它了解所有模块。
- **创建实例**: `workService := &works.WorkService{DB: dbInstance}` 创建了 `WorkFinder` 接口的具体实现。
- **注入**: `middlewares.WorkOwnerMiddleware(workService)` 将这个具体的服务实例传递给了中间件。此时，中间件就获得了执行数据库查询的能力，但它本身的代码仍然是解耦的。
- **应用**: `workScopedGroup.Use(...)` 将配置好的中间件应用到所有需要它的路由上，例如所有 `/works/:work_id/...` 的子路由。

---

#### **4. `backend/internal/apps/chapters/routers.go` & `drafts/routers.go` (简化)**

**作用**: 子资源路由处理器现在可以完全信赖中间件。

```go
// chapters/routers.go
func createChapter(c *gin.Context) {
	// ...
	// 无需再进行任何权限检查，直接从 context 中获取 work 对象
	work := c.MustGet("work").(works.Work)
	// ...
}
```

**代码详解**:
- `c.MustGet("work")`: 在 `chapters` 和 `drafts` 的路由处理器中，现在可以非常自信地从 `gin.Context` 中获取 `work` 对象。因为它们知道，如果请求能到达这里，那么 `WorkOwnerMiddleware` 一定已经成功执行，验证了作品的存在和所有权，并将 `work` 对象放入了 context。这使得业务逻辑代码更加纯粹和简洁。

---

### **执行目的**

此步骤的核心目标是**提升代码库的长期可维护性和架构质量**。通过这次重构：
1.  **解决了循环依赖**: 彻底消除了编译错误，使项目结构更加合理。
2.  **实现了关注点分离**:
    *   `middlewares` 只关心“验证”的逻辑。
    *   `works` 只关心“作品数据”的逻辑。
    *   `router` 只关心“组装和路由”的逻辑。
3.  **提高了可测试性**: 现在可以轻松地为 `WorkOwnerMiddleware` 编写单元测试，只需提供一个模拟（Mock）的 `WorkFinder` 实现即可，而无需连接真实的数据库。
4.  **增强了可扩展性**: 如果未来有新的资源（例如“作品评论”）也需要验证作品所有权，我们只需将 `WorkOwnerMiddleware` 应用于其路由组即可，无需重复编写验证逻辑。