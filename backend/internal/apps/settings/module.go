package settings

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/settings"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/repositories/gorm"
	settings_service "novel-man/backend/internal/services/settings"

	"github.com/gin-gonic/gin"
)

type settingsModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&settingsModule{})
	// 注册服务实现
	container.Container.Provide(gorm.NewSettingGormRepository)
	container.Container.Provide(settings_service.NewSettingService)

	// 注册控制器实现
	container.Container.Provide(settings.NewSettingController)
}

func (m *settingsModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *settings.SettingController,
		provider *middle.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		authedGroup := router.Group("/settings")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)
		{
			// These routes operate on the authenticated user's settings
			authedGroup.POST("", controller.CreateSetting)
			authedGroup.GET("", controller.ListSettings)
			authedGroup.GET("/user/:user_id", controller.GetSettingByUserID)
			authedGroup.PUT("/user/:user_id", controller.UpdateSettingByUserID)

			// Routes with /:id probably need ownership check if they are not admin-only
			// For now, we assume they are protected by the user's scope
			resourceGroup := authedGroup.Group("/:id")
			{
				resourceGroup.GET("", controller.GetSetting)
				resourceGroup.PUT("", controller.UpdateSetting)
				resourceGroup.DELETE("", controller.DeleteSetting)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *settingsModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
