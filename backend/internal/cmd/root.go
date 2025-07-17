package cmd

import (
	"fmt"
	"novel-man/backend/internal/apps/auth"
	"novel-man/backend/internal/apps/chapters"
	"novel-man/backend/internal/apps/characters"
	"novel-man/backend/internal/apps/drafts"
	"novel-man/backend/internal/apps/settings"
	"novel-man/backend/internal/apps/works"
	"novel-man/backend/internal/apps/worldview"
	"novel-man/backend/internal/config"
	"novel-man/backend/internal/db"
	"os"

	"github.com/spf13/cobra"
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
		// 初始化数据库连接
		_, err := db.InitDB(&config.Cfg.Database)
		if err != nil {
			fmt.Println("Error initializing database:", err)
			os.Exit(1)
		}

		// 执行数据库迁移
		db.Migrate(db.GetDB(), &auth.User{}, &settings.UserSetting{}, &works.Work{}, &chapters.Chapter{}, &drafts.Draft{}, &characters.Character{}, &worldview.WorldviewCategory{}, &worldview.WorldviewSetting{})
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
		config.LoadConfig(cfgFile)
	} else {
		// Search config in home directory with name ".novel-man" (without extension).
		_, err := config.LoadConfig(".")
		if err != nil {
			fmt.Println("Error reading config file:", err)
			os.Exit(1)
		}
	}
}
