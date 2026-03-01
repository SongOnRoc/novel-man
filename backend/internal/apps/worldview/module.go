package worldview

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	worldviewcontracts "novel-man/backend/internal/contracts/worldview"
	worldviewcontroller "novel-man/backend/internal/controllers/worldview"
	"novel-man/backend/internal/events"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/middlewares/resource"
	"novel-man/backend/internal/repositories/gorm"
	worldviewservice "novel-man/backend/internal/services/worldview"
	appctx "novel-man/backend/utils/context"

	"github.com/gin-gonic/gin"
)

type worldviewModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&worldviewModule{})
	// 注意：由于 WorldviewCategoryService 依赖于 WorldviewItemService，
	// 我们需要确保 WorldviewItemService 先被创建。
	container.Container.Provide(gorm.NewWorldviewCategoryGormRepository)
	container.Container.Provide(gorm.NewWorldviewItemGormRepository)
	container.Container.Provide(worldviewservice.NewWorldviewItemService)
	container.Container.Provide(worldviewservice.NewWorldviewCategoryService)

	// 注册控制器实现
	container.Container.Provide(worldviewcontroller.NewWorldviewController)
}

func (m *worldviewModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *worldviewcontroller.WorldviewController,
		provider *middle.MiddlewareProvider,
		eventManager *events.EventManager,
		categoryService worldviewcontracts.WorldviewCategoryService,
		itemService worldviewcontracts.WorldviewItemService,
	) {
		m.middlewareProvider = provider

		eventManager.RegisterRoutes(events.EventTypeWorldviewCategoryCreate, events.ModuleWorldview)
		eventManager.RegisterRoutes(events.EventTypeWorldviewCategoryUpdate, events.ModuleWorldview)
		eventManager.RegisterRoutes(events.EventTypeWorldviewItemCreate, events.ModuleWorldview)
		eventManager.RegisterRoutes(events.EventTypeWorldviewItemUpdate, events.ModuleWorldview)
		eventManager.RegisterConsumer(events.ModuleWorldview, func(ctx appctx.Context, task events.QueueTask) error {
			if task.AggregateType == events.AggregateTypeWorldviewCategory {
				return categoryService.HandleWorldviewCategoryTask(ctx, task)
			}
			return itemService.HandleWorldviewItemTask(ctx, task)
		})

		worldviewGroup := router.Group("/worldview")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		worldviewGroup.Use(authMiddleware)
		{
			categories := worldviewGroup.Group("/categories")
			{
				categories.POST("", controller.CreateCategory)
				categories.GET("", controller.GetCategories)

				categoryResourceGroup := categories.Group("/:id")
				existenceMiddleware, ok := m.getMiddleware(
					resource.ExistenceMiddlewareName(resource.WorldviewCategoryResource))
				if !ok {
					panic("worldview_category existence middleware not found")
				}
				categoryResourceGroup.Use(existenceMiddleware)

				ownershipMiddleware, ok := m.getMiddleware(resource.OwnershipMiddlewareName(resource.WorldviewCategoryResource))
				if !ok {
					panic("worldview_category ownership middleware not found")
				}
				categoryResourceGroup.Use(ownershipMiddleware)
				{
					categoryResourceGroup.GET("", controller.GetCategory)
					categoryResourceGroup.PUT("", controller.UpdateCategory)
					categoryResourceGroup.DELETE("", controller.DeleteCategory)
				}
			}

			items := worldviewGroup.Group("/items")
			{
				items.POST("", controller.CreateItem)
				items.GET("", controller.GetItems)

				itemResourceGroup := items.Group("/:id")
				existenceMiddleware, ok := m.getMiddleware(resource.ExistenceMiddlewareName(resource.WorldviewItemResource))
				if !ok {
					panic("worldview_item existence middleware not found")
				}
				itemResourceGroup.Use(existenceMiddleware)

				ownershipMiddleware, ok := m.getMiddleware(resource.OwnershipMiddlewareName(resource.WorldviewItemResource))
				if !ok {
					panic("worldview_item ownership middleware not found")
				}
				itemResourceGroup.Use(ownershipMiddleware)
				{
					itemResourceGroup.GET("", controller.GetItem)
					itemResourceGroup.PUT("", controller.UpdateItem)
					itemResourceGroup.DELETE("", controller.DeleteItem)
				}
			}
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *worldviewModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
