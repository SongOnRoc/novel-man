package favorites

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/favorites"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/repositories/gorm"
	favorites_service "novel-man/backend/internal/services/favorites"

	"github.com/gin-gonic/gin"
)

type favoritesModule struct{}

func init() {
	apps.Register(&favoritesModule{})
	container.Container.Provide(gorm.NewFavoriteGormRepository)
	container.Container.Provide(favorites_service.NewFavoriteService)
	container.Container.Provide(favorites.NewFavoriteController)
}

func (m *favoritesModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *favorites.FavoriteController,
		provider *middle.MiddlewareProvider,
	) {
		// 创建需要认证的路由组
		authedGroup := router.Group("/favorites")
		authMiddleware, ok := provider.Get(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware.Handler())

		{
			// GET /favorites?type=prompt - 获取收藏列表
			authedGroup.GET("", controller.ListFavorites)
			// POST /favorites - 添加收藏
			authedGroup.POST("", controller.AddFavorite)

			// 带资源类型和ID的路由组
			resourceGroup := authedGroup.Group("/:type/:id")
			{
				// GET /favorites/:type/:id - 检查是否已收藏
				resourceGroup.GET("", controller.CheckFavorite)
				// DELETE /favorites/:type/:id - 取消收藏
				resourceGroup.DELETE("", controller.RemoveFavorite)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}
