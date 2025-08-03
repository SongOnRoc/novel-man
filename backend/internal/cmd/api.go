package cmd

import (
	"fmt"
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/db"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/router"
	Ctx "novel-man/backend/utils/context"

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

		// 数据库已在 rootCmd 的 PersistentPreRun 中初始化
		dbInstance := db.GetDB()
		if dbInstance == nil {
			logger.Error(ctx, "failed to get database instance: db is nil")
			return
		}

		// 初始化中间件
		if err := middlewares.InitMiddlewares(); err != nil {
			logger.Error(ctx, "Error initializing middlewares: {}", err)
			return
		}

		// 初始化路由 - 使用新的自动路由注册机制
		r := router.InitRouter(dbInstance)

		// 启动服务器
		addr := fmt.Sprintf(":%d", config.Cfg.Server.Port)
		logger.Info(ctx, "API server listening on {}", addr)
		if err := r.Run(addr); err != nil {
			logger.Error(ctx, "failed to start server: {}", err)
		}
	},
}

func init() {
	rootCmd.AddCommand(apiCmd)
}
