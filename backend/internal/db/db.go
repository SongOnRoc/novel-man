package db

import (
	"fmt"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
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
		// SQLite WAL 策略：
		// - journal_mode=WAL: 提升并发读写
		// - synchronous=NORMAL: 性能与可靠性平衡
		// - busy_timeout=5000: 降低锁冲突报错
		dsn := fmt.Sprintf("%s?_journal_mode=WAL&_synchronous=NORMAL&_busy_timeout=5000", cfg.DSN)
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
		Logger:         logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("无法连接到数据库: %w", err)
	}

	if cfg.Type == "sqlite" {
		// 自动 checkpoint：WAL 达到阈值后自动合并回主库，避免 WAL 长期积压。
		// 1000 页约 4MB（默认 page_size=4KB）。
		if err := db.Exec("PRAGMA wal_autocheckpoint=1000;").Error; err != nil {
			return nil, fmt.Errorf("设置 sqlite wal_autocheckpoint 失败: %w", err)
		}

		// 进程启动时主动做一次温和 checkpoint，尝试回收历史 WAL。
		// 使用 PASSIVE：不强抢锁，失败也不影响启动。
		_ = db.Exec("PRAGMA wal_checkpoint(PASSIVE);").Error
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
