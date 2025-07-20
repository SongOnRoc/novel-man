package middlewares

import (
	"novel-man/backend/internal/container"
	"novel-man/backend/internal/contracts/middlewares"
	"go.uber.org/dig"
)

// MiddlewareProvider 中间件提供者，用于在模块中获取中间件
type MiddlewareProvider struct {
	registry *MiddlewareRegistry
}

// NewMiddlewareProvider 创建一个新的中间件提供者
func NewMiddlewareProvider() *MiddlewareProvider {
	return &MiddlewareProvider{
		registry: GetMiddlewareRegistry(),
	}
}

// Get 获取指定名称的中间件
func (p *MiddlewareProvider) Get(name string) (middlewares.Middleware, bool) {
	return p.registry.Get(name)
}

// GetAll 获取所有已注册的中间件
func (p *MiddlewareProvider) GetAll() map[string]middlewares.Middleware {
	return p.registry.GetAll()
}

// InitMiddlewares 初始化所有中间件模块
func InitMiddlewares() error {
	type MiddlewareInitializersIn struct {
		dig.In
		Initializers []middlewares.MiddlewareInitializer `group:"middleware_initializers"`
	}

	return container.Container.Invoke(func(in MiddlewareInitializersIn) error {
		registry := GetMiddlewareRegistry()
		for _, initializer := range in.Initializers {
			middleware, err := initializer.Init()
			if err != nil {
				return err
			}
			registry.Register(middleware)
		}
		return nil
	})
}

func init() {
	container.Container.Provide(NewMiddlewareProvider)
}
