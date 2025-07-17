## 已完成的部分总结

目前我们已经完成了：

1.  所有 MVP 功能模块的开发。
2.  一次中间件重构。

## 第 11 步：重构数据库层以支持多数据库

为了提升系统灵活性，我们通过实现数据库工厂模式，重构了数据库连接逻辑。

**修改文件**：

*   `backend/internal/config/config.go`
*   `backend/config.example.yaml`
*   `backend/internal/db/db.go`
*   `backend/internal/cmd/root.go`
*   `requirements/technical-spec-backend.md`

**代码详解**：

**`backend/internal/config/config.go`**

```go
// DatabaseConfig 存储数据库连接相关的配置
type DatabaseConfig struct {
	Type string `mapstructure:"type"`
	DSN  string `mapstructure:"dsn"`
}
```

1.  `DatabaseConfig` 结构体被修改为包含 `Type` 和 `DSN` 两个字段。
2.  `Type` 字段用于指定数据库的类型（例如 "mysql", "postgres", "sqlite"）。
3.  `DSN` (Data Source Name) 字段是数据库的连接字符串。

**`backend/internal/db/db.go`**

```go
// NewDatabase 根据提供的配置创建并返回一个新的数据库连接。
// 它支持 'mysql', 'postgres', 和 'sqlite'。
func NewDatabase(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	var dialector gorm.Dialector
	switch cfg.Type {
	case "mysql":
		dialector = mysql.Open(cfg.DSN)
	case "postgres":
		dialector = postgres.Open(cfg.DSN)
	case "sqlite":
		dialector = sqlite.Open(cfg.DSN)
	default:
		return nil, fmt.Errorf("不支持的数据库类型: %s", cfg.Type)
	}

	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("无法连接到数据库: %w", err)
	}

	return db, nil
}
```

1.  创建了 `NewDatabase` 工厂函数，它接收一个 `DatabaseConfig` 对象。
2.  函数内部使用 `switch` 语句，根据 `cfg.Type` 的值来选择合适的 GORM `Dialector`。
3.  这使得我们能够动态地为 MySQL, PostgreSQL, 或 SQLite 创建数据库连接。

**`backend/internal/cmd/root.go`**

```go
// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "novel-man",
	Short: "A backend service for novel management system.",
	Long:  `A backend service for novel management system, providing APIs for frontend.`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// 初始化数据库连接
		_, err := db.InitDB(&config.Cfg.Database)
		if err != nil {
			fmt.Println("Error initializing database:", err)
			os.Exit(1)
		}
        // ...
	},
}
```

1.  在 `rootCmd` 的 `PersistentPreRun` 钩子中，我们调用 `db.InitDB(&config.Cfg.Database)`。
2.  `InitDB` 函数内部会调用我们新创建的 `NewDatabase` 工厂函数，从而实现基于配置的动态数据库连接。

**执行目的**：

本次重构的核心目的是解耦应用程序与特定数据库实现之间的紧密绑定。通过引入数据库工厂模式，我们实现了以下目标：

1.  **可移植性**：应用程序不再依赖于任何单一的数据库。
2.  **灵活性**：开发或部署人员现在可以通过修改配置文件，轻松地在 MySQL、PostgreSQL 和 SQLite 之间进行切换，而无需更改任何代码。
3.  **可维护性**：数据库连接逻辑被集中在一个地方，使得未来的维护和扩展（例如，添加对新数据库的支持）变得更加简单。

**小结**：

通过对数据库层的重构，我们显著提高了系统的灵活性和可移植性，为未来的发展和不同的部署环境奠定了坚实的基础。