package ai

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	controllers "novel-man/backend/internal/controllers/ai"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	services "novel-man/backend/internal/services/ai"

	"github.com/gin-gonic/gin"
)

type aiModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&aiModule{})

	// Register service implementation
	container.Container.Provide(services.NewAIService)

	// Register controller implementation
	container.Container.Provide(controllers.NewAIController)
}

func (m *aiModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *controllers.AIController,
		provider *middle.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		authedGroup := router.Group("/ai")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)
		{
			authedGroup.POST("/completion", controller.Completion)
			authedGroup.POST("/polish", controller.Polish)
			authedGroup.POST("/generate-idea", controller.GenerateIdea)
			authedGroup.POST("/generate-outline", controller.GenerateOutline)
			authedGroup.POST("/create-character", controller.CreateCharacter)
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *aiModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
