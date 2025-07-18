package logger

import (
	"fmt"
	"io"
	"novel-man/backend/internal/config"
	Ctx "novel-man/backend/utils/context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"gopkg.in/natefinch/lumberjack.v2"
)

var (
	defaultLogger *Logger
	initOnce      sync.Once
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
	// 注册配置变更回调
	config.RegisterOnConfigChangeCallback(func(cfg *config.Config) {
		UpdateDefaultLoggerConfig(cfg.Log.Debug, cfg.Log.ConsoleLog)
	})
}

// New 创建一个新的日志记录器实例
func New(opts Options) *Logger {
	if opts.FilePath == "" {
		opts.FilePath = "./logs/app.log"
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

// getDefaultLogger 获取全局默认的 logger 实例
func getDefaultLogger() *Logger {
	initOnce.Do(func() {
		cfg := config.Cfg.Log
		defaultLogger = New(Options{
			IsDebug:       cfg.Debug,
			EnableConsole: cfg.ConsoleLog,
		})
	})
	return defaultLogger
}

// UpdateDefaultLoggerConfig 更新默认 logger 的配置
func UpdateDefaultLoggerConfig(isDebug, isConsole bool) {
	logger := getDefaultLogger()
	logger.isAtomicDebug.Store(isDebug)
	logger.isAtomicConsole.Store(isConsole)
}

// write 是核心的日志写入函数
func (l *Logger) write(levelStr string, ctx *Ctx.Context, format string, args ...interface{}) {
	timestamp := time.Now().Format("2006-01-02 15:04:05.000")

	traceID := ctx.TraceID()

	message := formatLog(format, args...)

	var finalMsg string
	if l.isAtomicDebug.Load().(bool) {
		_, file, line, ok := runtime.Caller(2)
		var caller string
		if ok {
			caller = fmt.Sprintf("%s:%d", filepath.Base(file), line)
		} else {
			caller = "unknown:0"
		}
		finalMsg = fmt.Sprintf("[%s][%s][%s][%s] %s\n", timestamp, levelStr, traceID, caller, message)
	} else {
		finalMsg = fmt.Sprintf("[%s][%s][%s] %s\n", timestamp, levelStr, traceID, message)
	}

	// 动态构建 writer
	var writers []io.Writer
	writers = append(writers, l.fileWriter)
	if l.isAtomicConsole.Load().(bool) {
		writers = append(writers, os.Stdout)
	}

	io.MultiWriter(writers...).Write([]byte(finalMsg))
}

// 全局函数，代理到 defaultLogger

func Debug(ctx *Ctx.Context, format string, args ...interface{}) {
	logger := getDefaultLogger()
	if logger.isAtomicDebug.Load().(bool) {
		logger.write("DEBUG", ctx, format, args...)
	}
}

func Info(ctx *Ctx.Context, format string, args ...interface{}) {
	getDefaultLogger().write("INFO", ctx, format, args...)
}

func Warn(ctx *Ctx.Context, format string, args ...interface{}) {
	getDefaultLogger().write("WARN", ctx, format, args...)
}

func Error(ctx *Ctx.Context, format string, args ...interface{}) {
	getDefaultLogger().write("ERROR", ctx, format, args...)
}

func formatLog(format string, args ...interface{}) string {
	for _, arg := range args {
		format = strings.Replace(format, "{}", fmt.Sprint(arg), 1)
	}
	return format
}
