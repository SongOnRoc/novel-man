package db

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"novel-man/backend/internal/config"
)

var DB *gorm.DB

// NewDatabase 根据提供的配置创建并返回一个新的数据库连接。
// 它支持 'mysql', 'postgres', 和 'sqlite'。
func NewDatabase(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	var dialector gorm.Dialector
	switch cfg.Type {
	case "mysql":
		dialector = mysql.Open(cfg.DSN)
	case "postgres":
		dialector = postgres.Open(cfg.DSN)
	case "sqlite":
		dialector = sqlite.Open(cfg.DSN)
	default:
		return nil, fmt.Errorf("不支持的数据库类型: %s", cfg.Type)
	}

	db, err := gorm.Open(dialector, &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("无法连接到数据库: %w", err)
	}

	return db, nil
}

// InitDB 初始化数据库连接并将其分配给全局变量 DB。
// 此函数用于向后兼容。
func InitDB(cfg *config.DatabaseConfig) (*gorm.DB, error) {
	var err error
	DB, err = NewDatabase(cfg)
	if err != nil {
		return nil, err
	}
	return DB, nil
}

// GetDB 返回数据库连接实例。
func GetDB() *gorm.DB {
	return DB
}
