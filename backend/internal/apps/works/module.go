package works

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/works"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/middlewares/resource"
	"novel-man/backend/internal/repositories/gorm"
	works_service "novel-man/backend/internal/services/works"

	"github.com/gin-gonic/gin"
)

type worksModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&worksModule{})
	container.Container.Provide(gorm.NewWorkGormRepository)
	container.Container.Provide(works_service.NewWorkService)
	container.Container.Provide(works.NewWorkController)
}

func (m *worksModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *works.WorkController,
		provider *middle.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		// 创建需要认证的路由组
		authedGroup := router.Group("/works")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)

		{
			authedGroup.POST("", controller.CreateWork)
			authedGroup.GET("", controller.ListWorks)

			// 创建需要资源存在性和所有权验证的路由组
			resourceGroup := authedGroup.Group("/:id")

			existenceMiddleware, ok := m.getMiddleware(resource.ExistenceMiddlewareName(resource.WorkResource))
			if !ok {
				panic("work existence middleware not found")
			}
			resourceGroup.Use(existenceMiddleware)

			ownershipMiddleware, ok := m.getMiddleware(resource.OwnershipMiddlewareName(resource.WorkResource))
			if !ok {
				panic("work ownership middleware not found")
			}
			resourceGroup.Use(ownershipMiddleware)

			{
				resourceGroup.GET("", controller.GetWork)
				resourceGroup.PUT("", controller.UpdateWork)
				resourceGroup.DELETE("", controller.DeleteWork)
				resourceGroup.POST("/publish", controller.PublishWork)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *worksModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
