package characters

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/characters"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	"novel-man/backend/internal/middlewares/resource"
	"novel-man/backend/internal/repositories/gorm"
	characters_service "novel-man/backend/internal/services/characters"

	"github.com/gin-gonic/gin"
)

type charactersModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&charactersModule{})
	// 注册仓储实现
	container.Container.Provide(gorm.NewCharacterGormRepository)
	container.Container.Provide(characters_service.NewCharacterService)

	// 注册服务实现
	container.Container.Provide(characters.NewCharacterController)
}

func (m *charactersModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *characters.CharacterController,
		provider *middle.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		authedGroup := router.Group("/characters")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)
		{
			authedGroup.POST("", controller.CreateCharacter)
			authedGroup.GET("", controller.ListCharacters)

			resourceGroup := authedGroup.Group("/:id")
			existenceMiddleware, ok := m.getMiddleware(resource.ExistenceMiddlewareName(resource.CharacterResource))
			if !ok {
				panic("character existence middleware not found")
			}
			resourceGroup.Use(existenceMiddleware)

			ownershipMiddleware, ok := m.getMiddleware(resource.OwnershipMiddlewareName(resource.CharacterResource))
			if !ok {
				panic("character ownership middleware not found")
			}
			resourceGroup.Use(ownershipMiddleware)
			{
				resourceGroup.GET("", controller.GetCharacter)
				resourceGroup.PUT("", controller.UpdateCharacter)
				resourceGroup.DELETE("", controller.DeleteCharacter)
			}
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *charactersModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
