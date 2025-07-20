package chapters

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/chapters"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/middlewares/resource"
	"novel-man/backend/internal/repositories/gorm"
	chapters_service "novel-man/backend/internal/services/chapters"

	"github.com/gin-gonic/gin"
)

type chaptersModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&chaptersModule{})
	// 注册仓储实现
	container.Container.Provide(gorm.NewChapterGormRepository)
	container.Container.Provide(chapters_service.NewChapterService)

	// 注册服务实现
	container.Container.Provide(chapters.NewChapterController)
}

func (m *chaptersModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *chapters.ChapterController,
		provider *middle.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		// 创建需要认证的路由组
		authedGroup := router.Group("/chapters")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)

		{
			authedGroup.POST("", controller.CreateChapter)
			authedGroup.GET("", controller.ListChapters)

			// 创建需要资源存在性和所有权验证的路由组
			resourceGroup := authedGroup.Group("/:id")

			existenceMiddleware, ok := m.getMiddleware(resource.ExistenceMiddlewareName(resource.ChapterResource))
			if !ok {
				panic("chapter existence middleware not found")
			}
			resourceGroup.Use(existenceMiddleware)

			ownershipMiddleware, ok := m.getMiddleware(resource.OwnershipMiddlewareName(resource.ChapterResource))
			if !ok {
				panic("chapter ownership middleware not found")
			}
			resourceGroup.Use(ownershipMiddleware)

			{
				resourceGroup.GET("", controller.GetChapter)
				resourceGroup.PUT("", controller.UpdateChapter)
				resourceGroup.DELETE("", controller.DeleteChapter)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *chaptersModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}