package db

import (
	"log"

	"gorm.io/gorm"
)

// Migrate 函数执行数据库迁移
func Migrate(db *gorm.DB, models ...interface{}) {
	log.Println("Running database migrations...")

	err := db.AutoMigrate(models...)

	if err != nil {
		log.Fatalf("Could not migrate database: %v", err)
	}

	log.Println("Database migration completed successfully.")
}
