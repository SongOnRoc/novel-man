package prompts

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/prompts"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/middlewares/resource"
	"novel-man/backend/internal/repositories/gorm"
	prompts_service "novel-man/backend/internal/services/prompts"

	"github.com/gin-gonic/gin"
)

type promptsModule struct{}

func init() {
	apps.Register(&promptsModule{})
	container.Container.Provide(gorm.NewPromptGormRepository)
	container.Container.Provide(gorm.NewGormUserRepository) // Ensure UserRepository is provided
	container.Container.Provide(prompts_service.NewPromptService)
	// NewPromptController now depends on UserRepository, which is already provided by the auth module.
	// The container will automatically resolve this dependency.
	container.Container.Provide(prompts.NewPromptController)
}

func (m *promptsModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *prompts.PromptController,
		provider *middle.MiddlewareProvider,
	) {
		// 创建需要认证的路由组
		authedGroup := router.Group("/prompts")
		authMiddleware, ok := provider.Get(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware.Handler())

		{
			authedGroup.GET("", controller.ListPrompts)
			authedGroup.POST("", controller.CreatePrompt)
			authedGroup.POST("/import", controller.Import)

			// 创建需要资源存在性和所有权验证的路由组
			resourceGroup := authedGroup.Group("/:id")

			existenceMiddleware, ok := provider.Get(resource.ExistenceMiddlewareName(resource.PromptResource))
			if !ok {
				panic("prompt existence middleware not found")
			}
			resourceGroup.Use(existenceMiddleware.Handler())

			ownershipMiddleware, ok := provider.Get(resource.OwnershipMiddlewareName(resource.PromptResource))
			if !ok {
				panic("prompt ownership middleware not found")
			}
			resourceGroup.Use(ownershipMiddleware.Handler())

			{
				resourceGroup.GET("", controller.GetPrompt)
				resourceGroup.PUT("", controller.UpdatePrompt)
				resourceGroup.DELETE("", controller.DeletePrompt)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}
