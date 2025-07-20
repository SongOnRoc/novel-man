package db

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/schema" // Import the schema package for NamingStrategy
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
		// Enable WAL mode for better concurrency and to prevent read-after-write issues in tests.
		dsn := fmt.Sprintf("%s?_pragma=journal_mode=WAL", cfg.DSN)
		dialector = sqlite.Open(dsn)
	default:
		return nil, fmt.Errorf("不支持的数据库类型: %s", cfg.Type)
	}

	// Define the naming strategy to use plural table names.
	namingStrategy := schema.NamingStrategy{
		SingularTable: false,
	}

	db, err := gorm.Open(dialector, &gorm.Config{
		NamingStrategy: namingStrategy,
	})
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
