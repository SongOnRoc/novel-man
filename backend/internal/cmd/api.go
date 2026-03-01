package cmd

import (
	stdctx "context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"novel-man/backend/internal/config"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/db"
	"novel-man/backend/internal/events"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/router"
	Ctx "novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
	"github.com/spf13/cobra"
)

// apiCmd represents the api command
var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "Start the API server",
	Long:  `Start the API server to handle HTTP requests.`,
	Run: func(cmd *cobra.Command, args []string) {
		ctx := Ctx.New(cmd.Context())
		logger.Info(ctx, "Starting API server...")

		initGinMode()

		// 数据库已在 rootCmd 的 PersistentPreRun 中初始化
		dbInstance := db.GetDB()
		if dbInstance == nil {
			logger.Error(ctx, "failed to get database instance: db is nil")
			return
		}

		// 初始化系统提示词种子数据
		if err := db.SeedSystemPrompts(ctx, dbInstance); err != nil {
			logger.Error(ctx, "Error seeding system prompts: {}", err)
			// 不中断启动，仅记录错误
		}

		// 初始化中间件
		if err := middlewares.InitMiddlewares(); err != nil {
			logger.Error(ctx, "Error initializing middlewares: {}", err)
			return
		}

		if err := container.Container.Invoke(func(scheduler *events.QueueScheduler, outbox events.OutboxStore, notifier *events.NotifierWorker) {
			applySchedulerConcurrency(ctx, scheduler, config.Cfg.Events.ModuleConcurrency)

			collectorStop := startEventAlertCollector(
				scheduler,
				outbox,
				notifier,
				config.Cfg.Events,
			)
			defer collectorStop()
			defer notifier.Stop()

			// 初始化路由 - 使用新的自动路由注册机制
			r := router.InitRouter(dbInstance)

			// 启动服务器（支持优雅停机）
			addr := fmt.Sprintf(":%d", config.Cfg.Server.Port)
			server := &http.Server{
				Addr:    addr,
				Handler: r,
			}
			logger.Info(ctx, "API server listening on {}", addr)

			errCh := make(chan error, 1)
			go func() {
				if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
					errCh <- err
				}
				close(errCh)
			}()

			sigCh := make(chan os.Signal, 1)
			signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
			defer signal.Stop(sigCh)

			select {
			case err := <-errCh:
				if err != nil {
					logger.Error(ctx, "failed to start server: {}", err)
				}
				return
			case sig := <-sigCh:
				logger.Info(ctx, "shutdown signal received: {}", sig.String())
			}

			// 退出顺序：先停采集，再停 notifier，最后关 HTTP server。
			collectorStop()
			notifier.Stop()

			shutdownCtx, cancel := stdctx.WithTimeout(stdctx.Background(), 10*time.Second)
			defer cancel()
			if err := server.Shutdown(shutdownCtx); err != nil {
				logger.Error(ctx, "server shutdown failed: {}", err)
				return
			}
			logger.Info(ctx, "server shutdown completed")
		}); err != nil {
			logger.Error(ctx, "events runtime wiring failed: {}", err)
			return
		}
	},
}

func initGinMode() {
	// 允许通过环境变量强制指定（与 Gin 官方一致）。
	// 为避免无效值导致 gin.SetMode panic，这里做一次白名单校验。
	if envMode := strings.ToLower(strings.TrimSpace(os.Getenv("GIN_MODE"))); envMode != "" {
		switch envMode {
		case gin.DebugMode, gin.ReleaseMode, gin.TestMode:
			gin.SetMode(envMode)
		}
		return
	}

	// 统一默认行为：默认 Gin 使用 release，避免启动时的 debug warning/路由打印噪音。
	// 如需 Gin debug，请显式设置环境变量：GIN_MODE=debug
	gin.SetMode(gin.ReleaseMode)
}

func init() {
	rootCmd.AddCommand(apiCmd)
}
