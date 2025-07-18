package db

import (
	"novel-man/backend/internal/logger"
	Ctx "novel-man/backend/utils/context"

	"gorm.io/gorm"
)

// Migrate 函数执行数据库迁移
func Migrate(ctx *Ctx.Context, db *gorm.DB, models ...interface{}) {
	logger.Info(ctx, "Running database migrations...")

	err := db.AutoMigrate(models...)

	if err != nil {
		logger.Error(ctx, "Could not migrate database: {}", err)
	}

	logger.Info(ctx, "Database migration completed successfully.")
}
