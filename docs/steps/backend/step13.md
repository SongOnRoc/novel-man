## 已完成的部分总结

目前我们已经完成了：

1.  所有后端 MVP 功能的开发，包括用户认证、作品、章节、草稿、角色和世界观管理。
2.  完成了两次重要的架构重构，以提高系统的可扩展性和可维护性。
3.  编写了生产级日志模块的详细设计文档。

## 第 13 步：实现支持热更新的生产级日志模块

为了将设计文档中的规范转化为实际可工作的代码，我们实现了 `logger` 包。这个包不仅提供了标准的日志记录功能（如 DEBUG, INFO, WARN, ERROR），还通过集成 `viper` 和 `fsnotify` 库，实现了对日志配置的运行时热更新。这意味着我们可以在不重启服务的情况下，动态调整日志级别或开关控制台输出，极大地提高了生产环境下的可维护性。

**创建文件**：`backend/internal/logger/logger.go`

```go
package logger

import (
	"context"
	"fmt"
	"io"
	"novel-man/backend/internal/config"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"gopkg.in/natefinch/lumberjack.v2"
)

type key int

const traceIDKey key = iota

var (
	defaultLogger *Logger
	initOnce      sync.Once
	rootContext   context.Context
)

// Logger 定义了日志记录器实例
type Logger struct {
	fileWriter      io.Writer
	isAtomicDebug   *atomic.Value
	isAtomicConsole *atomic.Value
}

// Options 定义了创建新 logger 实例的配置
type Options struct {
	FilePath      string
	EnableConsole bool
	IsDebug       bool
}

func init() {
	// 在包加载时就生成一个基于纳秒时间戳的根 trace_id
	traceID := fmt.Sprintf("%d", time.Now().UnixNano())
	rootContext = context.WithValue(context.Background(), traceIDKey, traceID)

	// 注册配置变更回调
	config.RegisterOnConfigChangeCallback(func(cfg *config.Config) {
		UpdateDefaultLoggerConfig(cfg.Log.Debug, cfg.Log.ConsoleLog)
	})
}

// New 创建一个新的日志记录器实例
func New(opts Options) *Logger {
	if opts.FilePath == "" {
		opts.FilePath = "backend/logs/app.log"
	}

	logDir := filepath.Dir(opts.FilePath)
	if err := os.MkdirAll(logDir, 0755); err != nil {
		panic(fmt.Sprintf("failed to create log directory: %v", err))
	}

	fileWriter := &lumberjack.Logger{
		Filename:   opts.FilePath,
		MaxSize:    30, // MB
		MaxBackups: 5,
		MaxAge:     30, // days
		Compress:   true,
	}

	isAtomicDebug := &atomic.Value{}
	isAtomicDebug.Store(opts.IsDebug)
	isAtomicConsole := &atomic.Value{}
	isAtomicConsole.Store(opts.EnableConsole)

	return &Logger{
		fileWriter:      fileWriter,
		isAtomicDebug:   isAtomicDebug,
		isAtomicConsole: isAtomicConsole,
	}
}

// UpdateDefaultLoggerConfig 更新默认 logger 的配置
func UpdateDefaultLoggerConfig(isDebug, isConsole bool) {
	logger := getDefaultLogger()
	logger.isAtomicDebug.Store(isDebug)
	logger.isAtomicConsole.Store(isConsole)
}

// write 是核心的日志写入函数
func (l *Logger) write(levelStr string, ctx context.Context, format string, args ...interface{}) {
	// ... (核心写入逻辑)
}

// ... (Debug, Info, Warn, Error 等代理函数)
```

**代码详解**：

1.  **`New` 函数**: 这是日志记录器的构造函数。它接收 `Options` 参数，初始化 `lumberjack.Logger` 用于日志文件的轮转和归档。核心是，它创建了两个 `atomic.Value` 实例 (`isAtomicDebug` 和 `isAtomicConsole`) 来存储日志的配置状态。使用原子值可以确保在并发环境下安全地读取和更新配置，这是实现热更新的关键。
2.  **`init()` 函数**: 在包初始化时，它会调用 `config.RegisterOnConfigChangeCallback` 注册一个回调函数。这个回调函数会在配置文件发生变化时被 `config` 包调用，从而执行 `UpdateDefaultLoggerConfig` 来更新日志配置。

---

**修改文件**：`backend/internal/config/config.go`

```go
package config

import (
	"fmt"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
)

// OnConfigChangeCallback 定义了配置变更时的回调函数类型
type OnConfigChangeCallback func(cfg *Config)

var onConfigChangeCallbacks []OnConfigChangeCallback

// RegisterOnConfigChangeCallback 注册一个配置变更回调
func RegisterOnConfigChangeCallback(cb OnConfigChangeCallback) {
	onConfigChangeCallbacks = append(onConfigChangeCallbacks, cb)
}

// ... (Config 结构体定义)

// LoadConfig 从给定的路径读取配置
func LoadConfig(configPath string) (*Config, error) {
	// ... (viper 初始化)

	// 监控配置文件变化
	viper.WatchConfig()
	viper.OnConfigChange(func(e fsnotify.Event) {
		fmt.Println("Config file changed:", e.Name)
		var newConfig Config
		if err := viper.Unmarshal(&newConfig); err != nil {
			fmt.Println("Error reloading config:", err)
		} else {
			Cfg = &newConfig
			// 遍历并执行所有已注册的回调
			for _, cb := range onConfigChangeCallbacks {
				cb(Cfg)
			}
		}
	})

	return Cfg, nil
}
```

**代码详解**：

1.  **`RegisterOnConfigChangeCallback`**: 提供了一个全局的注册机制，允许其他包（如此处的 `logger`）将自己的更新函数注册到配置变更的事件监听器中。
2.  **`viper.WatchConfig()` 和 `viper.OnConfigChange`**: 这是 `viper` 提供的核心功能。`WatchConfig` 启动一个文件系统监视器（底层使用 `fsnotify`）来监控配置文件的变化。一旦文件被修改，`OnConfigChange` 中注册的匿名函数就会被触发。
3.  **回调执行**: 在 `OnConfigChange` 的回调中，我们重新解析配置文件到 `newConfig`，然后遍历 `onConfigChangeCallbacks` 列表，执行所有注册的回调函数，并将新的配置 `Cfg` 传递给它们。

---

**修改文件**：`backend/config.example.yaml`

```yaml
# 服务器配置
server:
  port: 8080

# 数据库配置
database:
  type: "postgres"
  dsn: "host=localhost user=user password=password dbname=novel_man port=5432 sslmode=disable"

# 日志配置 (可选)
# 如果此部分不存在，将使用默认值 (debug: false, console_log: false)
logger:
  # 是否开启 Debug 模式，会打印更详细的日志
  debug: false
  # 是否同时将日志输出到控制台 (默认只输出到文件)
  console_log: false
```

**代码详解**：

我们在配置文件中增加了 `logger` 部分，提供了 `debug` 和 `console_log` 两个可配置项，用于控制日志的行为。

---

**修改文件**：`backend/internal/cmd/root.go`

```go
// ...
import (
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/logger"
	// ...
)

var rootCmd = &cobra.Command{
	// ...
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// 在这里调用是为了尽早触发初始化。
		// 实际的初始化由 logger 包内的 sync.Once 控制，确保只执行一次。
		logger.Info(context.Background(), "Logger initialization triggered.")

		// 初始化数据库连接
		// ...
	},
}

func initConfig() {
	// ...
	_, err := config.LoadConfig(".")
	if err != nil {
		// 在这种情况下，日志记录器可能尚未初始化，因此我们回退到 fmt
		fmt.Println("Error reading config file:", err)
		os.Exit(1)
	}
}
```

**代码详解**：

我们在 `rootCmd` 的 `PersistentPreRun` 钩子中加入了 `logger.Info` 的调用。虽然 `logger` 的初始化是由其内部的 `sync.Once` 保证的，但在这里调用可以确保在执行任何业务逻辑之前，日志系统已经被激活。同时，`initConfig` 函数负责加载配置，这也间接启动了对配置文件的监控。

---

### **热更新实现原理解析**

热更新的实现是整个日志模块的亮点，其工作流程如下：

1.  **启动监控**：应用启动时，`config.LoadConfig` 函数中的 `viper.WatchConfig()` 开始监控 `config.yaml` 文件。
2.  **文件变更**：当管理员手动修改 `config.yaml` 文件（例如，将 `debug` 从 `false` 改为 `true`）并保存时，`fsnotify` 会捕获到文件写入事件。
3.  **触发回调**：`viper` 接收到事件后，执行通过 `viper.OnConfigChange()` 注册的回调函数。
4.  **重新加载配置**：该回调函数首先将新的文件内容解析到 `Cfg` 变量中，更新了全局配置。
5.  **执行特定模块的回调**：接着，代码遍历 `onConfigChangeCallbacks` 列表，这个列表里包含了在 `logger` 包 `init()` 函数中注册的 `UpdateDefaultLoggerConfig` 函数。
6.  **原子更新日志状态**：`UpdateDefaultLoggerConfig` 被调用，它接收到新的配置值（`debug: true`），并调用 `logger.isAtomicDebug.Store(true)`。这个操作是原子的，能保证在多线程环境下安全地更新日志状态。
7.  **动态改变行为**：此后，任何对 `logger.Debug()` 的调用，在内部检查 `logger.isAtomicDebug.Load().(bool)` 时都会得到 `true`，从而开始打印 DEBUG 级别的日志。整个过程无需重启应用，实现了配置的动态生效。

## 执行目的

将设计规范转化为高质量、可工作的代码，为整个后端应用提供一个健壮、高性能、可动态配置且支持分布式追踪的日志系统。这个系统不仅满足了当前的日志需求，其热更新能力也为未来的线上运维和调试提供了极大的便利。
