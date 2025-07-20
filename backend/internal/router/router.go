package router

import (
	"net/http"
	"novel-man/backend/internal/apps"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// InitRouter initializes the Gin router and automatically registers routes for all modules
func InitRouter(dbInstance *gorm.DB) *gin.Engine {
	// 创建 Gin 引擎实例
	r := gin.Default()

	// 将数据库实例存入 Gin Context，供后续中间件和处理函数使用
	r.Use(func(c *gin.Context) {
		c.Set("db", dbInstance)
		c.Next()
	})

	// 创建 API v1 路由组
	apiV1 := r.Group("/api/v1")

	// 自动注册所有模块的路由
	// 遍历已注册的模块，调用其 RegisterRoutes 方法注册路由
	for _, mod := range apps.GetRegisteredModules() {
		mod.RegisterRoutes(apiV1)
	}

	// 健康检查端点
	apiV1.GET("/health", func(c *gin.Context) {
		sqlDB, err := dbInstance.DB()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "failed to get db instance"})
			return
		}
		err = sqlDB.Ping()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "database ping failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	return r
}
