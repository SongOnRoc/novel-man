package config

import (
	"fmt"

	"github.com/fsnotify/fsnotify"
	"github.com/spf13/viper"
)

// OnConfigChangeCallback 定义了配置变更时的回调函数类型
type OnConfigChangeCallback func(cfg *Config)

var onConfigChangeCallbacks []OnConfigChangeCallback

// RegisterOnConfigChangeCallback 注册一个配置变更回调
func RegisterOnConfigChangeCallback(cb OnConfigChangeCallback) {
	onConfigChangeCallbacks = append(onConfigChangeCallbacks, cb)
}

// Config 存储所有应用程序的配置
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Log      LogConfig      `mapstructure:"logger"`
}

// ServerConfig 存储服务器相关的配置
type ServerConfig struct {
	Port int `mapstructure:"port"`
}

// DatabaseConfig 存储数据库连接相关的配置
type DatabaseConfig struct {
	Type string `mapstructure:"type"`
	DSN  string `mapstructure:"dsn"`
}

var Cfg *Config

// LogConfig 存储日志相关的配置
type LogConfig struct {
	Debug      bool `mapstructure:"debug"`
	ConsoleLog bool `mapstructure:"console_log"`
}

// LoadConfig 从给定的路径读取配置
func LoadConfig(configPath string) (*Config, error) {
	viper.AddConfigPath(configPath)
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")

	viper.AutomaticEnv()

	// 设置默认值
	viper.SetDefault("logger.debug", false)
	viper.SetDefault("logger.console_log", false)

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("无法读取配置文件: %w", err)
		}
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("无法解析配置: %w", err)
	}

	Cfg = &config

	// 监控配置文件变化
	viper.WatchConfig()
	viper.OnConfigChange(func(e fsnotify.Event) {
		fmt.Println("Config file changed:", e.Name)
		var newConfig Config
		if err := viper.Unmarshal(&newConfig); err != nil {
			fmt.Println("Error reloading config:", err)
		} else {
			Cfg = &newConfig
			for _, cb := range onConfigChangeCallbacks {
				cb(Cfg)
			}
		}
	})

	return Cfg, nil
}
