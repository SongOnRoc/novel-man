package drafts

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	drafts_contract "novel-man/backend/internal/contracts/drafts"
	"novel-man/backend/internal/controllers/drafts"
	"novel-man/backend/internal/events"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/middlewares/resource"
	"novel-man/backend/internal/repositories/gorm"
	drafts_service "novel-man/backend/internal/services/drafts"

	"github.com/gin-gonic/gin"
)

type draftsModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&draftsModule{})
	// 注册服务实现
	container.Container.Provide(gorm.NewDraftGormRepository)
	container.Container.Provide(gorm.NewChapterGormRepository) // 为 DraftService 提供依赖
	container.Container.Provide(gorm.NewWorkGormRepository)    // 为 DraftService 提供依赖
	container.Container.Provide(drafts_service.NewDraftService)

	// 注册控制器实现
	container.Container.Provide(drafts.NewDraftController)
}

func (m *draftsModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *drafts.DraftController,
		provider *middle.MiddlewareProvider,
		eventManager *events.EventManager,
		draftService drafts_contract.DraftService,
	) {
		m.middlewareProvider = provider

		eventManager.RegisterRoutes(events.EventTypeDraftsCreate, events.ModuleDrafts)
		eventManager.RegisterRoutes(events.EventTypeDraftsUpdate, events.ModuleDrafts)
		eventManager.RegisterConsumer(events.ModuleDrafts, draftService.HandleDraftTask)

		authedGroup := router.Group("/drafts")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)
		{
			authedGroup.POST("", controller.CreateDraft)
			authedGroup.GET("", controller.ListDrafts)

			resourceGroup := authedGroup.Group("/:id")
			existenceMiddleware, ok := m.getMiddleware(resource.ExistenceMiddlewareName(resource.DraftResource))
			if !ok {
				panic("draft existence middleware not found")
			}
			resourceGroup.Use(existenceMiddleware)

			ownershipMiddleware, ok := m.getMiddleware(resource.OwnershipMiddlewareName(resource.DraftResource))
			if !ok {
				panic("draft ownership middleware not found")
			}
			resourceGroup.Use(ownershipMiddleware)
			{
				resourceGroup.GET("", controller.GetDraft)
				resourceGroup.PUT("", controller.UpdateDraft)
				resourceGroup.DELETE("", controller.DeleteDraft)
				resourceGroup.POST("/publish", controller.PublishDraft)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *draftsModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
