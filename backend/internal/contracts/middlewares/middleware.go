package middlewares

import (
	"github.com/gin-gonic/gin"
)

// Middleware 定义了通用中间件接口
type Middleware interface {
	// Handler 返回一个 gin.HandlerFunc，用于注册到路由中
	Handler() gin.HandlerFunc

	// Name 返回中间件的名称，用于标识和获取中间件
	Name() string
}

// MiddlewareInitializer 定义了中间件初始化器的接口
type MiddlewareInitializer interface {
	// Init 创建并返回一个中间件实例
	Init() (Middleware, error)
}
