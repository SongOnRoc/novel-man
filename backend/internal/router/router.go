package router

import (
	"net/http"
	"novel-man/backend/internal/apps"

	_ "novel-man/backend/docs" // Import the generated docs

	ginSwagger "github.com/SongOnRoc/gin-swagger"
	swaggerFiles "github.com/swaggo/files"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// InitRouter initializes the Gin router and automatically registers routes for all modules
func InitRouter(dbInstance *gorm.DB) *gin.Engine {
	// 创建 Gin 引擎实例
	r := gin.Default()

	// 安全基线：不信任任何上游代理（避免 X-Forwarded-For 被伪造）
	// 如后续接入 Nginx/Ingress，再按实际代理网段放开。
	if err := r.SetTrustedProxies([]string{}); err != nil {
		panic("failed to set trusted proxies: " + err.Error())
	}

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

	// Swagger documentation route
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	return r
}
