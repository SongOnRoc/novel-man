package relationships

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/relationships"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/middlewares/resource"
	"novel-man/backend/internal/repositories/gorm"
	relationships_service "novel-man/backend/internal/services/relationships"

	"github.com/gin-gonic/gin"
)

type relationshipsModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&relationshipsModule{})
	// 注册服务实现
	container.Container.Provide(gorm.NewRelationshipGormRepository)
	container.Container.Provide(relationships_service.NewRelationshipService)
	container.Container.Provide(relationships.NewRelationshipController)
}

func (m *relationshipsModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *relationships.RelationshipController,
		provider *middle.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		// 创建需要认证的路由组
		authedGroup := router.Group("/relationships")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)

		{
			authedGroup.POST("", controller.CreateRelationship)
			authedGroup.GET("", controller.ListRelationships)

			// 创建需要资源存在性和所有权验证的路由组
			resourceGroup := authedGroup.Group("/:id")

			existenceMiddleware, ok := m.getMiddleware(resource.ExistenceMiddlewareName(resource.RelationshipResource))
			if !ok {
				panic("relationship existence middleware not found")
			}
			resourceGroup.Use(existenceMiddleware)

			ownershipMiddleware, ok := m.getMiddleware(resource.OwnershipMiddlewareName(resource.RelationshipResource))
			if !ok {
				panic("relationship ownership middleware not found")
			}
			resourceGroup.Use(ownershipMiddleware)

			{
				resourceGroup.GET("", controller.GetRelationship)
				resourceGroup.PUT("", controller.UpdateRelationship)
				resourceGroup.DELETE("", controller.DeleteRelationship)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *relationshipsModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
