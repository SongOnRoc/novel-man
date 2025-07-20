## 已完成的部分总结

这是后端开发任务的起点，我们从零开始搭建整个项目。

## 第 1 步：项目初始化与基础设置

为了搭建一个健壮且可扩展的后端服务骨架，我们执行了以下关键操作：

1.  **创建项目目录结构**: 规划了 `cmd`, `internal`, `pkg` 等标准 Go 项目目录。
2.  **初始化 Go 模块**: 使用 `go mod init` 创建了 `go.mod` 文件，用于管理项目依赖。
3.  **配置管理**: 引入 `viper` 库，通过 `config.yaml` 文件管理应用配置，实现了配置与代码的分离。
4.  **命令行接口 (CLI)**: 使用 `cobra` 库构建了强大的命令行工具，提供了 `api` 子命令来启动服务器。
5.  **数据库集成**: 集成了 `gorm` 和 `postgres` 驱动，实现了数据库的初始化和连接。
6.  **基础路由**: 使用 `gin` 框架搭建了基础的 HTTP 服务和路由结构。

---

### **创建文件与代码详解**

#### **1. `backend/go.mod`**

**作用**: 定义项目模块路径和管理所有依赖项。

```go
module novel-man/backend

go 1.23.0

require (
	github.com/gin-contrib/sessions v1.0.4
	github.com/gin-gonic/gin v1.10.1
	github.com/spf13/cobra v1.9.1
	github.com/spf13/viper v1.20.1
	gorm.io/driver/postgres v1.6.0
	gorm.io/gorm v1.30.0
)
```

**代码详解**:
- `module novel-man/backend`: 定义了项目的模块路径。
- `go 1.23.0`: 指定了项目使用的 Go 版本。
- `require`: 列出了项目的直接依赖，如 `gin` (Web 框架), `cobra` (CLI 框架), `viper` (配置管理), 和 `gorm` (ORM 库)。

---

#### **2. `backend/config.example.yaml`**

**作用**: 提供一个配置模板，方便开发者快速了解和设置本地环境。

```yaml
# 服务器配置
server:
  port: 8080

# 数据库配置
database:
  host: "localhost"
  port: 5432
  user: "user"
  password: "password"
  dbname: "novel_man"
  sslmode: "disable"
```

**代码详解**:
- `server`: 定义了 HTTP 服务器的监听端口。
- `database`: 包含了连接 PostgreSQL 数据库所需的所有参数。

---

#### **3. `backend/internal/config/config.go`**

**作用**: 使用 `viper` 加载和解析 `config.yaml` 文件，并将配置信息映射到 Go 结构体中，供应用全局使用。

```go
package config

import (
	"fmt"
	"github.com/spf13/viper"
)

// Config 存储所有应用程序的配置
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
}

// ... 其他结构体定义 ...

var Cfg *Config

// LoadConfig 从给定的路径读取配置
func LoadConfig(configPath string) (*Config, error) {
	viper.AddConfigPath(configPath)
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")

	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("无法读取配置文件: %w", err)
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("无法解析配置: %w", err)
	}

	Cfg = &config
	return Cfg, nil
}
```

**代码详解**:
- `Config` 结构体精确地对应 `config.yaml` 的层级结构。
- `LoadConfig` 函数负责查找、读取和反序列化配置文件。
- `Cfg` 是一个全局变量，方便在应用的其他地方直接访问配置项。

---

#### **4. `backend/cmd/main.go`**

**作用**: 项目的唯一入口文件，其职责是调用 `cmd` 包来执行命令行程序。

```go
package main

import "novel-man/backend/internal/cmd"

func main() {
	cmd.Execute()
}
```

**代码详解**:
- `main()` 函数直接调用了 `cmd.Execute()`，启动了由 `cobra` 管理的命令行应用。

---

#### **5. `backend/internal/cmd/root.go`**

**作用**: 定义了根命令 `novel-man`，并处理全局的初始化逻辑，如加载配置和初始化数据库。

```go
package cmd

import (
	// ... imports ...
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "novel-man",
	Short: "A backend service for novel management system.",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// 初始化数据库连接
		dbInstance, err := db.InitDB(&config.Cfg.Database)
		if err != nil {
			// ... error handling ...
		}
		// 执行数据库迁移
		db.Migrate(dbInstance, &auth.User{}, ...)
	},
}

func init() {
	cobra.OnInitialize(initConfig)
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ./config.yaml)")
}

func initConfig() {
    // ... 使用 viper 加载配置 ...
}

func Execute() {
	rootCmd.Execute()
}
```

**代码详解**:
- `rootCmd`: `cobra` 的根命令，所有其他命令都是它的子命令。
- `PersistentPreRun`: 这是一个在任何子命令执行之前都会运行的钩子函数。我们在这里完成了数据库的初始化和自动迁移，确保后续操作的数据库是最新结构。
- `initConfig`: 通过 `cobra.OnInitialize` 注册，负责在命令解析前加载配置文件。

---

#### **6. `backend/internal/cmd/api.go`**

**作用**: 定义了 `api` 子命令，负责启动 Web 服务器。

```go
package cmd

import (
	// ... imports ...
)

var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "Start the API server",
	Run: func(cmd *cobra.Command, args []string) {
		dbInstance := db.GetDB()
		// 初始化路由
		r := router.InitRouter(dbInstance)
		// 启动服务器
		addr := fmt.Sprintf(":%d", config.Cfg.Server.Port)
		if err := r.Run(addr); err != nil {
			panic(fmt.Sprintf("failed to start server: %v", err))
		}
	},
}

func init() {
	rootCmd.AddCommand(apiCmd)
}
```

**代码详解**:
- `apiCmd`: 一个 `cobra` 命令，通过 `go run main.go api` 来执行。
- `Run`: 该命令的核心逻辑。它获取已经初始化好的数据库连接，用它来初始化 Gin 路由，最后根据配置的端口号启动 HTTP 服务器。

---

#### **7. `backend/internal/db/db.go`**

**作用**: 封装了数据库连接的逻辑。

```go
package db

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"novel-man/backend/internal/config"
)

var DB *gorm.DB

// InitDB 初始化数据库连接
func InitDB(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s user=%s ...", ... )
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("无法连接到数据库: %w", err)
	}
	DB = db
	return DB, nil
}

// GetDB 返回数据库连接实例
func GetDB() *gorm.DB {
	return DB
}
```

**代码详解**:
- `InitDB`: 根据传入的数据库配置，生成 DSN (Data Source Name)，并使用 `gorm.Open` 创建数据库连接池。
- `DB`: 一个全局变量，存储了数据库连接实例，方便在各处调用。
- `GetDB`: 提供了获取该全局实例的标准方法。

---

#### **8. `backend/internal/router/router.go`**

**作用**: 初始化 Gin 引擎，并设置全局中间件和顶层路由。

```go
package router

import (
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	// ... other app imports
)

// InitRouter initializes the Gin router
func InitRouter(dbInstance *gorm.DB) *gin.Engine {
	r := gin.Default()

	// 设置 Session 中间件
	store := cookie.NewStore([]byte("secret"))
	r.Use(sessions.Sessions("mysession", store))

	// 将数据库实例存入 Gin Context
	r.Use(func(c *gin.Context) {
		c.Set("db", dbInstance)
		c.Next()
	})

	// API v1 group
	apiV1 := r.Group("/api/v1")
	{
		// ... 路由注册 ...
	}

	return r
}
```

**代码详解**:
- `InitRouter`: 创建一个默认的 Gin 路由器。
- **Session 中间件**: 使用 `gin-contrib/sessions` 设置了基于 cookie 的 session，为后续的用户认证做准备。
- **数据库注入中间件**: 这是一个自定义中间件，它将 `gorm.DB` 实例存入每个请求的 `gin.Context` 中。这使得在后续的请求处理函数中，可以通过 `c.Get("db")` 方便地获取数据库连接，避免了使用全局变量。
- **API 分组**: 创建了 `/api/v1` 路由组，为所有 API 添加了统一的前缀，便于版本管理。

---

### **执行目的**

此步骤的核心目标是**搭建一个可运行、可配置、可扩展的后端应用基础框架**。通过完成这些基础设置，我们为后续的功能模块开发（如用户认证、作品管理等）奠定了坚实的基础，确保了代码的组织性、可维护性和一致性。