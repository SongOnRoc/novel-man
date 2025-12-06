package generate

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	controllers "novel-man/backend/internal/controllers/generate"
	"novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/middlewares/auth"
	services "novel-man/backend/internal/services/generate"

	"github.com/gin-gonic/gin"
)

type generateModule struct {
	middlewareProvider *middlewares.MiddlewareProvider
}

func init() {
	apps.Register(&generateModule{})

	// Register service implementation
	container.Container.Provide(services.NewLLMService)
	container.Container.Provide(services.NewGenerateService)

	// Register controller implementation
	container.Container.Provide(controllers.NewGenerateController)
}

func (m *generateModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *controllers.GenerateController,
		provider *middlewares.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		authedGroup := router.Group("/generate")
		authMiddleware, ok := m.getMiddleware(auth.AuthMiddlewareName)
		if !ok {
			panic("auth middleware not found")
		}
		authedGroup.Use(authMiddleware)
		{
			authedGroup.GET("", controller.GetAssistantTypes)
			authedGroup.GET("/models", controller.GetAvailableModels)
			authedGroup.POST("", controller.GenerateText)
		}
	})
	if err != nil {
		panic(err)
	}
}

func (m *generateModule) getMiddleware(name string) (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get(name)
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
