package cmd

import (
	"fmt"
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/db"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models" // Import the new central models package
	Ctx "novel-man/backend/utils/context"
	"os"

	"github.com/spf13/cobra"
	"gorm.io/gorm"
)

var (
	cfgFile string
)

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "novel-man",
	Short: "A backend service for novel management system.",
	Long:  `A backend service for novel management system, providing APIs for frontend.`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		// 初始化默认日志记录器。
		// 实际的初始化由 sync.Once 控制，确保只执行一次。
		// 在这里调用是为了尽早触发初始化。
		ctx := Ctx.New(cmd.Context())
		// st := struct {
		// 	name string
		// 	age  int
		// }{
		// 	name: "John Doe",
		// 	age:  30,
		// }
		// for {
		// 	logger.Info(ctx, "Logger initialization triggered.:{}, {}", time.Now().Format("2006-01-02 15:04:05"), st)
		// 	time.Sleep(time.Second)
		// }

		// 初始化数据库连接
		dbInstance, err := db.InitDB(&config.Cfg.Database)
		if err != nil {
			logger.Error(ctx, "Error initializing database: {}", err)
			panic(err)
		}

		// 将 *gorm.DB 提供给 DI 容器
		err = container.Container.Provide(func() *gorm.DB {
			return dbInstance
		})
		if err != nil {
			logger.Error(ctx, "Error providing *gorm.DB to container: {}", err)
			panic(err)
		}

		// 执行数据库迁移
		// Execute database migration with the new unified models.
		db.Migrate(ctx, db.GetDB(),
			&models.User{},
			&models.Work{},
			&models.Volume{},
			&models.Chapter{},
			&models.Draft{},
			&models.Character{},
			&models.WorldviewCategory{},
			&models.WorldviewItem{},
			&models.WorkCharacter{},
			&models.EntityRelationship{},
			&models.Prompt{},
			&models.UserAICustomSetting{},
			&models.UserFavorite{},
			// &settings.UserSetting{}, // TODO: Refactor UserSetting to also use the central models package if needed.
		)
	},
}

// Execute adds all child commands to the root command and sets flags appropriately.
// This is called by main.main(). It only needs to happen once to the rootCmd.
func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	cobra.OnInitialize(initConfig)
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ./config.yaml)")
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		_, _ = config.LoadConfig(cfgFile)
	} else {
		// Search config in home directory with name ".novel-man" (without extension).
		_, err := config.LoadConfig(".")
		if err != nil {
			// 在这种情况下，日志记录器可能尚未初始化，因此我们回退到 fmt
			fmt.Println("Error reading config file:", err)
			os.Exit(1)
		}
	}
}
