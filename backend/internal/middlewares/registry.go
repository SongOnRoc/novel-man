package middlewares

import (
	"novel-man/backend/internal/contracts/middlewares"
	"sync"
)

var (
	registry     *MiddlewareRegistry
	registryOnce sync.Once
)

// MiddlewareRegistry 中间件注册表，用于管理所有已注册的中间件
type MiddlewareRegistry struct {
	middlewares map[string]middlewares.Middleware
	mutex sync.RWMutex
}

// GetMiddlewareRegistry 获取全局中间件注册表实例
func GetMiddlewareRegistry() *MiddlewareRegistry {
	registryOnce.Do(func() {
		registry = &MiddlewareRegistry{
			middlewares: make(map[string]middlewares.Middleware),
		}
	})
	return registry
}

// Register 注册一个中间件
func (r *MiddlewareRegistry) Register(middleware middlewares.Middleware) {
	r.mutex.Lock()
	defer r.mutex.Unlock()

	if r.middlewares == nil {
		r.middlewares = make(map[string]middlewares.Middleware)
	}
	r.middlewares[middleware.Name()] = middleware
}

// Get 获取指定名称的中间件
func (r *MiddlewareRegistry) Get(name string) (middlewares.Middleware, bool) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	m, ok := r.middlewares[name]
	return m, ok
}

// GetAll 获取所有已注册的中间件
func (r *MiddlewareRegistry) GetAll() map[string]middlewares.Middleware {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	// 返回副本以避免并发问题
	result := make(map[string]middlewares.Middleware)
	for k, v := range r.middlewares {
		result[k] = v
	}
	return result
}

