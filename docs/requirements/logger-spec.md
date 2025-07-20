# 日志模块技术需求文档

## 1. 概述

日志是保障应用可观测性 (Observability) 和可维护性的基石。一个设计良好的日志系统能够帮助我们快速定位并解决生产环境中的问题、监控应用性能、审计关键操作和安全事件。

为了构建一个健壮、高性能且可扩展的日志系统，本项目将基于业界广泛采用的 Go 日志库 **Zap (`go.uber.org/zap`)** 进行封装和实现。Zap 以其卓越的性能和低开销而著称，非常适合生产环境。

本需求文档旨在定义日志模块的核心功能、接口规范和配置标准，作为后续开发的指导。

## 2. 核心功能需求

### 2.1. 结构化日志

- **JSON 格式**: 为机器解析和日志聚合系统（如 ELK, Datadog）优化，包含所有结构化字段。是生产环境日志聚合的首选。
- **控制台友好格式 (`console`)**: 为本地开发环境优化，输出到标准输出，带有颜色和简洁的格式，提升开发体验。
- **人性化文本格式 (`text`)**: 为文件日志的人工阅读进行优化。格式清晰，比 `json` 更紧凑，不含颜色代码，适合记录需要人工快速审查的流程性或审计日志。
- **格式可配置**: 输出格式（`json`, `console`, `text`）必须能通过配置文件进行灵活切换，以适应不同环境和实例的需求。

### 2.2. 日志级别

- **标准级别**: 模块必须至少支持以下四个核心日志级别：
    - `DEBUG`: 用于记录详细的调试信息，通常在开发环境中开启。
    - `INFO`: 用于记录常规的应用运行信息，如请求处理、系统状态变更等。
    - `WARN`: 用于记录潜在的问题或非关键性错误。
    - `ERROR`: 用于记录导致功能失败的严重错误。
- **配置文件级别控制**: 日志的记录级别 (`level`) 必须可以通过配置文件进行设置，作为默认的日志输出策略。

### 2.3. 动态 Debug 模式 (热切换)

为了在不重启服务的情况下对生产环境进行临时问题排查，必须支持动态开启/关闭 Debug 模式。

- **信号文件机制**: 通过检测应用可访问的特定位置是否存在一个“信号文件”（例如，应用根目录下的 `.debug` 文件）来动态调整日志级别。
    - **开启 Debug**: 如果检测到 `.debug` 文件存在，日志级别将**自动、动态地提升至 `debug`**，无论配置文件中的设置为何。
    - **关闭 Debug**: 如果 `.debug` 文件被删除，日志级别将**自动、动态地恢复**到配置文件中 `level` 项所指定的级别。
- **后台监控**: 应有一个轻量级的后台协程定期（例如，每分钟）检查该信号文件的存在，以实现级别的动态调整，避免对主程序造成性能影响。

### 2.3. 日志轮转 (Log Rotation)

- **集成 Lumberjack**: 当日志输出到文件时，必须集成 **Lumberjack (`gopkg.in/natefinch/lumberjack.v2`)** 库来实现日志文件的自动轮转。
- **可配置参数**: 必须支持通过配置文件设置以下轮转策略参数：
    - `filename` (string): 日志文件的完整路径。
    - `maxsize` (int): 单个日志文件的最大体积（单位：MB）。当文件达到此大小时，将被轮转。
    - `maxbackups` (int): 保留的旧日志文件的最大数量。
    - `maxage` (int): 旧日志文件的最大保留天数。
    - `compress` (bool): 是否对轮转后的旧日志文件进行 `gzip` 压缩，以节省磁盘空间。

### 2.4. 输出目标

- **多目标支持**: 日志模块应支持将日志输出到不同的目标：
    - `file`: 输出到指定的日志文件。
    - `stdout`: 输出到标准输出流。
- **目标可配置**: 输出目标必须可以通过配置文件进行切换。

### 2.5. 分布式追踪集成

- **Context 传递**: 所有的日志记录函数（如 `Info`, `Error` 等）都必须接收 `context.Context` 作为第一个参数。
- **自动注入 Trace Info**: 如果 `context.Context` 中包含了 OpenTelemetry 的 Span 信息，日志模块必须自动提取 `trace_id` 和 `span_id`，并将它们作为固定的字段（`trace_id` 和 `span_id`）添加到每一条结构化日志记录中。这是实现微服务架构下跨服务链路追踪的关键。

### 2.6. 上下文信息

- **附加字段**: 日志记录函数应支持以键值对（`key-value pairs`）的形式传入额外的上下文信息。这些信息将被附加到结构化日志中，用于记录特定请求或业务操作的详细数据。例如：`userID`, `orderID` 等。

### 2.7. 模块化日志

- **模块化实例**: 应支持创建带有模块名称的日志记录器实例。例如，`logger.Module("database")` 将返回一个新的记录器实例，其所有输出的日志都会自动带上 `module: database` 字段。
- **全局与模块化并存**: 系统应同时提供一个全局的单例记录器和按需创建模块化记录器的能力。

### 2.8. 内置日志字段与格式

为了在提供详尽上下文的同时保证可读性，日志模块将内置以下字段，并根据输出格式智能展示：

- **内置字段**:
    - `timestamp`: 日志时间
    - `level`: 日志级别
    - `trace_id`: 分布式追踪 ID
    - `pid`: 进程 ID
    - `tid`: 线程 ID (或 Goroutine ID)
    - `caller`: 调用者信息（包名、文件名、函数名、行号）

- **展示策略**:
    - **JSON 格式**: 所有内置字段都将作为独立的 `key-value` 对添加到日志对象中，以便于机器解析。
    - **Console / Text 格式**: 字段的详细程度与配置的日志级别直接相关。
        - **当 `level` 为 `info` 或更高时 (非 Debug 模式)**: 为了日志的简洁和高效，仅展示核心追踪信息，格式为：`[时间][进程:协程][level][traceid][文件名:行号]`。
        - **当 `level` 为 `debug` 时 (Debug 模式)**: 为了方便调试，`DEBUG` 级别的日志将展示所有可用的内置字段，包括 `[时间][level][traceid][pid][tid][gid][包名][文件名][函数名:行号]`。

## 3. 接口设计 (API)

为了方便在整个应用中统一调用，并提升使用便利性，日志模块应提供一个简洁的、全局可访问的接口，并支持格式化字符串。

```go
package logger

import (
    "context"
)

// 全局方法

// Debug 记录 debug 级别的格式化日志
// 示例: logger.Debug(ctx, "user {userID} login failed", 123)
func Debug(ctx context.Context, format string, args ...interface{})

// Info 记录 info 级别的格式化日志
func Info(ctx context.Context, format string, args ...interface{})

// Warn 记录 warn 级别的格式化日志
func Warn(ctx context.Context, format string, args ...interface{})

// Error 记录 error 级别的格式化日志
func Error(ctx context.Context, format string, args ...interface{})

// 实例创建

// New 根据提供的配置创建一个新的、独立的日志记录器实例。
// 这允许在系统不同部分使用完全隔离的日志行为。
func New(cfg Config) (*Logger, error)

// 模块化方法

// Module 返回一个带有指定模块名称的记录器实例
func Module(name string) *Logger

// Logger 模块化记录器实例
type Logger struct {
    // ... 内部实现
}

// 模块化记录器的方法
func (l *Logger) Debug(ctx context.Context, format string, args ...interface{})
func (l *Logger) Info(ctx context.Context, format string, args ...interface{})
func (l *Logger) Warn(ctx context.Context, format string, args ...interface{})
func (l *Logger) Error(ctx context.Context, format string, args ...interface{})

```
*注：`...interface{}` 参数的实现应将 `format` 字符串中用 `{}` 包围的占位符替换为 `args` 中的实际值，类似于 `fmt.Sprintf`，但使用 `{}` 作为定界符。*

## 4. 配置示例

以下是一个完整的 `config.example.yaml` 配置片段，展示了如何配置日志模块的所有选项。

```yaml
# 日志配置
logger:
  level: "debug"  # 日志级别: debug, info, warn, error
  format: "console" # 输出格式: console, json, text
  output: "stdout" # 输出目标: stdout, file
  console_caller: "short" # 控制台调用者信息格式: short (文件名:行号), full (完整路径:行号)

  # 文件输出配置 (仅当 output 为 file 时生效)
  file:
    filename: "logs/app.log" # 日志文件路径
    maxsize: 100      # 单个文件最大体积 (MB)
    maxbackups: 5     # 最多保留的旧文件数
    maxage: 30        # 旧文件最长保留天数
    compress: true    # 是否压缩旧文件
```

---
该文档详细定义了日志模块的需求，为后续的开发和实现提供了清晰的指引。