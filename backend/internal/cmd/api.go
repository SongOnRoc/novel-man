package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/db"
	"novel-man/backend/internal/router"
)

// apiCmd represents the api command
var apiCmd = &cobra.Command{
	Use:   "api",
	Short: "Start the API server",
	Long:  `Start the API server to handle HTTP requests.`,
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("Starting API server...")
		// 数据库已在 rootCmd 的 PersistentPreRun 中初始化
		dbInstance := db.GetDB()
		if dbInstance == nil {
			panic("failed to get database instance: db is nil")
		}

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
