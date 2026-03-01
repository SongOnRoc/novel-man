package auth

import (
	"novel-man/backend/internal/apps"
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/controllers/auth"
	middle "novel-man/backend/internal/middlewares"
	"novel-man/backend/internal/repositories/gorm"
	auth_service "novel-man/backend/internal/services/auth"

	"github.com/gin-gonic/gin"
)

type authModule struct {
	middlewareProvider *middle.MiddlewareProvider
}

func init() {
	apps.Register(&authModule{})
	container.Container.Provide(gorm.NewGormUserRepository)
	container.Container.Provide(auth_service.NewAuthService)
	container.Container.Provide(auth.NewAuthController)
}

func (m *authModule) RegisterRoutes(router *gin.RouterGroup) {
	err := container.Container.Invoke(func(
		controller *auth.AuthController,
		provider *middle.MiddlewareProvider,
	) {
		m.middlewareProvider = provider

		authGroup := router.Group("/auth")
		{
			authGroup.POST("/register", controller.Register)
			authGroup.POST("/login", controller.Login)
		}

		// 需要认证的路由组
		authRequiredGroup := router.Group("/auth")
		authMiddleware, ok := m.getAuthMiddleware()
		if !ok {
			panic("auth middleware not found")
		}

		authRequiredGroup.Use(authMiddleware)
		{
			authRequiredGroup.GET("/me", controller.GetCurrentUser)
			authRequiredGroup.POST("/logout", controller.Logout)
		}
	})
	if err != nil {
		panic(err)
	}
}

// getAuthMiddleware 获取认证中间件
func (m *authModule) getAuthMiddleware() (gin.HandlerFunc, bool) {
	middleware, ok := m.middlewareProvider.Get("auth")
	if !ok {
		return nil, false
	}
	return middleware.Handler(), true
}
