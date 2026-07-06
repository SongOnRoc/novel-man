package cmd

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"novel-man/backend/internal/config"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/db"
	"novel-man/backend/internal/logger"
	"novel-man/backend/internal/models" // Import the new central models package
	Ctx "novel-man/backend/utils/context"

	"github.com/spf13/cobra"
	"golang.org/x/crypto/bcrypt"
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
		workingDir, wdErr := os.Getwd()
		if wdErr != nil {
			workingDir = "<unknown>"
		}

		resolvedDSN := config.Cfg.Database.DSN
		if config.Cfg.Database.Type == "sqlite" {
			if absPath, absErr := filepath.Abs(config.Cfg.Database.DSN); absErr == nil {
				resolvedDSN = absPath
			}
		}

		logger.Info(
			ctx,
			"startup config resolved cwd={} db_type={} db_dsn={} admin_enabled={} admin_username={} admin_email={} admin_reset_password_on_boot={}",
			workingDir,
			config.Cfg.Database.Type,
			resolvedDSN,
			config.Cfg.Admin.Enabled,
			config.Cfg.Admin.Username,
			config.Cfg.Admin.Email,
			config.Cfg.Admin.ResetPasswordOnBoot,
		)

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
			&models.OpsJobLock{},
			&models.OpsJob{},
			// &settings.UserSetting{}, // TODO: Refactor UserSetting to also use the central models package if needed.
		)

		if err := ensureBootstrapAdmin(ctx, dbInstance, config.Cfg.Admin); err != nil {
			logger.Error(ctx, "Error ensuring bootstrap admin: {}", err)
			panic(err)
		}
	},
}

func ensureBootstrapAdmin(ctx *Ctx.Context, dbInstance *gorm.DB, cfg config.AdminBootstrapConfig) error {
	if !cfg.Enabled {
		logger.Info(ctx, "bootstrap admin skipped: admin.enabled=false")
		return nil
	}

	username := strings.TrimSpace(cfg.Username)
	email := strings.TrimSpace(cfg.Email)
	password := cfg.Password
	if username == "" || email == "" || password == "" {
		return fmt.Errorf("admin bootstrap requires username, email and password")
	}

	var user models.User
	result := dbInstance.WithContext(*ctx).
		Where("username = ? OR email = ?", username, email).
		First(&user)
	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return result.Error
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	if errors.Is(result.Error, gorm.ErrRecordNotFound) || user.ID == 0 {
		logger.Info(ctx, "bootstrap admin not found, creating username={} email={}", username, email)
		user = models.User{
			Username:     username,
			Email:        email,
			PasswordHash: string(hashedPassword),
			Role:         "admin",
		}
		if err := dbInstance.WithContext(*ctx).Create(&user).Error; err != nil {
			return err
		}
		logger.Info(ctx, "Bootstrap admin created: {}", username)
		return nil
	}

	logger.Info(ctx, "bootstrap admin found existing user id={} username={} email={} role={}", user.ID, user.Username, user.Email, user.Role)

	updates := map[string]any{
		"username": username,
		"email":    email,
		"role":     "admin",
	}
	if cfg.ResetPasswordOnBoot {
		updates["password_hash"] = string(hashedPassword)
	}

	if err := dbInstance.WithContext(*ctx).Model(&models.User{}).
		Where("id = ?", user.ID).
		Updates(updates).Error; err != nil {
		return err
	}

	logger.Info(ctx, "Bootstrap admin ensured: {}", username)
	return nil
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
