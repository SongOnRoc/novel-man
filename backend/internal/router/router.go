package router

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"net/http"
	"novel-man/backend/internal/apps/ai"
	"novel-man/backend/internal/apps/auth"
	"novel-man/backend/internal/apps/chapters"
	"novel-man/backend/internal/apps/characters"
	"novel-man/backend/internal/apps/drafts"
	"novel-man/backend/internal/apps/settings"
	"novel-man/backend/internal/apps/works"
	"novel-man/backend/internal/apps/worldview"
	"novel-man/backend/internal/middlewares"
)

// InitRouter initializes the Gin router
func InitRouter(dbInstance *gorm.DB) *gin.Engine {
	r := gin.Default()

	// 将数据库实例存入 Gin Context
	r.Use(func(c *gin.Context) {
		c.Set("db", dbInstance)
		c.Next()
	})

	// API v1 group
	apiV1 := r.Group("/api/v1")
	{
		// 注册 auth 路由
		// 注册 auth 路由
		authGroup := apiV1.Group("/auth")
		{
			// 公开路由，无需认证
			auth.RegisterPublicRoutes(authGroup, dbInstance)

			// 私有路由，需要认证
			privateAuthGroup := authGroup.Group("/")
			privateAuthGroup.Use(middlewares.JWTAuthMiddleware())
			auth.RegisterPrivateRoutes(privateAuthGroup, dbInstance)
		}

		// 注册 works 路由
		worksGroup := apiV1.Group("/works")
		worksGroup.Use(middlewares.JWTAuthMiddleware())
		works.RegisterRoutes(worksGroup, dbInstance)

		// Register chapters routes (nested under works)
		// The middleware will ensure the user owns the work
		// workService := &works.WorkService{DB: dbInstance}
		workScopedGroup := worksGroup.Group("/:work_id")
		// TODO: Re-implement WorkOwnerMiddleware for JWT
		// workScopedGroup.Use(middlewares.WorkOwnerMiddleware(workService))
		chapters.RegisterRoutes(workScopedGroup, dbInstance)
		drafts.RegisterRoutes(workScopedGroup, dbInstance)

		// 注册 characters 路由
		charactersGroup := apiV1.Group("/characters")
		charactersGroup.Use(middlewares.JWTAuthMiddleware())
		characters.RegisterRoutes(charactersGroup)

		// 注册 worldview 路由
		worldviewGroup := apiV1.Group("/worldview")
		worldviewGroup.Use(middlewares.JWTAuthMiddleware())
		worldview.RegisterRoutes(worldviewGroup)

		// 注册 settings 路由
		settingsGroup := apiV1.Group("/")
		settingsGroup.Use(middlewares.JWTAuthMiddleware())
		settings.RegisterRoutes(settingsGroup)

		// 注册 ai 路由
		aiGroup := apiV1.Group("/ai")
		aiGroup.Use(middlewares.JWTAuthMiddleware())
		ai.RegisterRoutes(aiGroup)

		// Health check endpoint
		apiV1.GET("/health", func(c *gin.Context) {
			// Check database connection
			sqlDB, err := dbInstance.DB()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"status":  "error",
					"message": "failed to get db instance",
				})
				return
			}

			err = sqlDB.Ping()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{
					"status":  "error",
					"message": "database ping failed",
				})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"status": "ok",
			})
		})
	}

	return r
}
